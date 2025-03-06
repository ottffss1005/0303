import os
import io
import re
import json
import uuid
import cv2  # OpenCV
import numpy as np

from PIL import Image, ImageFilter
from pyzbar.pyzbar import decode

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils import timezone

from pymongo import MongoClient

from google.cloud import vision

# BASE_DIR: manage.py가 있는 디렉터리 기준
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# regions.json 파일 로드 (프로젝트 루트에 위치)
REGIONS_FILE = os.path.join(BASE_DIR, "regions.json")
try:
    with open(REGIONS_FILE, "r", encoding="utf-8") as f:
        regions_from_file = json.load(f)
except Exception as e:
    print("Error loading regions from:", REGIONS_FILE, e)
    regions_from_file = [
        "서울",
        "부산",
        "대구",
        "인천",
        "광주",
        "대전",
        "울산",
        "세종",
        "경기",
        "강원",
        "충북",
        "충남",
        "전북",
        "전남",
        "경북",
        "경남",
        "제주",
    ]


def get_mongo_db():
    """
    MongoDB 연결 함수.
    settings.MONGO_URI에 정의된 연결 문자열을 사용하여 기본 DB를 반환.
    """
    client = MongoClient(settings.MONGO_URI)
    db = client.get_default_database()
    return db


def normalize_card_text(text):
    """
    OCR 결과에서 b, O, I 등의 오인식을 보정.
    """
    mapping = {
        "b": "6",
        "B": "8",
        "O": "0",
        "o": "0",
        "I": "1",
        "l": "1",
        "S": "5",
        "s": "5",
        "Z": "2",
        "z": "2",
    }
    normalized = []
    for ch in text:
        normalized.append(mapping[ch] if ch in mapping else ch)
    return "".join(normalized)


def preprocess_image_for_ocr(file_bytes):
    """
    OpenCV를 사용한 기본 전처리:
      - 그레이스케일, 가우시안 블러, Otsu 이진화, Deskew(회전 보정)
    전처리된 이미지를 JPEG bytes로 반환.
    """
    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        print("OpenCV imdecode failed, returning original.")
        return file_bytes

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    _, threshed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(threshed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        max_contour = max(contours, key=cv2.contourArea)
        rect = cv2.minAreaRect(max_contour)
        angle = rect[-1]
        if angle < -45:
            angle += 90
        elif angle > 45:
            angle -= 90
        (h, w) = threshed.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            threshed, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
        )
        threshed = rotated
    else:
        print("No contours found, skip deskew.")

    ret, processed_bytes = cv2.imencode(".jpg", threshed)
    if not ret:
        print("cv2.imencode failed, returning original.")
        return file_bytes
    return processed_bytes.tobytes()


# 정규표현식 및 키워드
PHONE_PATTERN = re.compile(r"\b(0\d{1,2})[- ]?(\d{3,4})[- ]?(\d{4})\b")
SSN_PATTERN = re.compile(r"\b(\d{6})[- ]?(\d{7})\b")
# 카드번호 패턴: 2~4그룹, 예: "5461-1211" 또는 "5461-1211-****-****"
CARD_PATTERN = re.compile(
    r"\b(?:[\d\*]{4})(?:[-\s]+(?:[\d\*]{4})){1,3}\b", re.IGNORECASE
)
ID_PW_KEYWORDS = ["id", "아이디", "pw", "비밀번호"]
SENSITIVE_KEYWORDS = ["신분증", "운전면허증", "여권", "명함", "노트"]
ADDRESS_REGEX = re.compile(
    r"(경기도|서울(?:특별시)?|부산(?:광역시)?|대구(?:광역시)?|인천(?:광역시)?|광주(?:광역시)?|대전(?:광역시)?|울산(?:광역시)?|세종(?:특별자치시)?|강원|충북|충남|전북|전남|경북|경남|제주)"
    r"\s*[가-힣0-9\s\-]+(?:로|길)\s*\d+",
    re.IGNORECASE,
)


@csrf_exempt
def blur_image(request):
    """
    POST로 전달된 photoId를 기반으로 MongoDB의 analysis 컬렉션에서
    해당 photoId 문서가 있는지 확인하고, BASE_DIR/uploaded_images/{photoId}.jpg
    파일에서 위험 요소(바코드, 카드번호, regions 지명, 주소, ID/PW 등)를 검출한 후
    처리 기준에 따라 블러 처리합니다.

    처리 기준:
      • ID/PW: 좌표 확장 후 중간 강도 블러 (GaussianBlur, radius=80)
      • 주소: ADDRESS_REGEX 또는 "집주소" 포함 → 매우 강한 블러 (GaussianBlur, radius=150)
      • 카드번호: OCR 전처리(normalize_card_text) 후 카드번호 패턴 매칭 시,
                  전체 카드(이미지가 카드라 가정)를 강하게 블러 처리 (GaussianBlur, radius=150)
      • regions.json 지명: 감지 시 전체 카드 블러 처리 (GaussianBlur, radius=150)
      • 기타(전화번호, 주민등록번호, 민감 키워드): 일반 블러 (GaussianBlur, radius=50)
      • 바코드/QR: 바코드 영역 확대(50px 확장) 후 일반 블러 (GaussianBlur, radius=50)
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST 요청만 허용됩니다."}, status=405)

    photoId = request.POST.get("photoId")
    if not photoId:
        return JsonResponse({"error": "photoId가 제공되지 않았습니다."}, status=400)

    db = get_mongo_db()
    analysis_coll = db["analysis"]
    analysis_doc = analysis_coll.find_one({"photoId": photoId})
    if not analysis_doc:
        return JsonResponse(
            {"error": f"photoId {photoId}에 해당하는 분석 기록이 없습니다."}, status=404
        )

    image_path = os.path.join(BASE_DIR, "uploaded_images", f"{photoId}.jpg")
    if not os.path.exists(image_path):
        return JsonResponse(
            {"error": f"이미지 파일을 찾을 수 없습니다: {image_path}"}, status=404
        )

    try:
        with open(image_path, "rb") as f:
            original_bytes = f.read()
        pil_image = Image.open(io.BytesIO(original_bytes)).convert("RGB")
    except Exception as e:
        return JsonResponse({"error": f"이미지 로드 실패: {str(e)}"}, status=500)

    img_width, img_height = pil_image.size

    # 전처리 (OCR용)
    processed_bytes = preprocess_image_for_ocr(original_bytes)

    # 바코드/QR 검출 (원본 이미지 사용) → 영역 확장 적용
    try:
        codes = decode(pil_image)
    except Exception as e:
        codes = []
        print("Barcode/QR detection error:", e)

    risk_boxes = []
    barcode_expansion = 50
    for code in codes:
        rect = code.rect
        x1 = rect.left - barcode_expansion
        y1 = rect.top - barcode_expansion
        x2 = rect.left + rect.width + barcode_expansion
        y2 = rect.top + rect.height + barcode_expansion
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(img_width, x2)
        y2 = min(img_height, y2)
        risk_boxes.append({"box": (x1, y1, x2, y2), "proc": "normal"})

    # OCR 처리 (전처리된 이미지 사용)
    client = vision.ImageAnnotatorClient()
    vision_image = vision.Image(content=processed_bytes)
    response = client.text_detection(image=vision_image)
    annotations = response.text_annotations

    final_image = pil_image.copy()
    card_full_detected = False

    if annotations and len(annotations) > 1:
        for annotation in annotations[1:]:
            detected_text = annotation.description
            vertices = annotation.bounding_poly.vertices
            if not vertices:
                continue
            xs = [v.x for v in vertices if v.x is not None]
            ys = [v.y for v in vertices if v.y is not None]
            if not xs or not ys:
                continue
            x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
            lower_text = detected_text.lower()
            proc_type = None

            # 1) ID/PW → 중간 강도 블러 (radius=80)
            if any(kw in lower_text for kw in [w.lower() for w in ID_PW_KEYWORDS]):
                proc_type = "idpw"
                expansion = 100
                x1 = max(0, x1 - expansion)
                y1 = max(0, y1 - expansion)
                x2 = min(img_width, x2 + expansion)
                y2 = min(img_height, y2 + expansion)
            # 2) 주소 → 매우 강한 블러 (radius=150)
            elif ADDRESS_REGEX.search(detected_text) or "집주소" in lower_text:
                proc_type = "strong"
            else:
                # 3) 카드번호: 전처리 후 카드번호 패턴 매칭
                normalized = normalize_card_text(detected_text)
                if re.search(CARD_PATTERN, normalized):
                    proc_type = "card_full"
                    card_full_detected = True
                # 4) regions.json 지명 → 카드 전체 블러 처리
                elif any(
                    r.lower() in lower_text
                    for r in [x.lower() for x in regions_from_file]
                ):
                    proc_type = "card_full"
                    card_full_detected = True
                # 5) 전화번호, 주민등록번호
                elif PHONE_PATTERN.search(detected_text) or SSN_PATTERN.search(
                    detected_text
                ):
                    proc_type = "normal"
                else:
                    for kw in SENSITIVE_KEYWORDS:
                        if kw in detected_text:
                            proc_type = "normal"
                            break

            if proc_type and proc_type != "card_full":
                risk_boxes.append({"box": (x1, y1, x2, y2), "proc": proc_type})

    # 만약 카드번호나 regions 지명이 감지되면 전체 카드(이미지 전체)를 블러 처리
    if card_full_detected:
        final_image = final_image.filter(ImageFilter.GaussianBlur(radius=150))
    else:
        for item in risk_boxes:
            x1, y1, x2, y2 = item["box"]
            proc = item["proc"]
            try:
                region = final_image.crop((x1, y1, x2, y2))
                if proc == "idpw":
                    blurred = region.filter(ImageFilter.GaussianBlur(radius=80))
                    final_image.paste(blurred, (x1, y1))
                elif proc == "strong":
                    blurred = region.filter(ImageFilter.GaussianBlur(radius=150))
                    final_image.paste(blurred, (x1, y1))
                else:
                    blurred = region.filter(ImageFilter.GaussianBlur(radius=50))
                    final_image.paste(blurred, (x1, y1))
            except Exception as e:
                print("영역 처리 오류:", e)

    output_buffer = io.BytesIO()
    final_image.save(output_buffer, format="JPEG")
    output_buffer.seek(0)
    return HttpResponse(output_buffer.getvalue(), content_type="image/jpeg")
