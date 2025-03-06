import os
import io
import re
import json
import uuid

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


# MongoDB 연결 함수 (settings.MONGO_URI 사용)
def get_mongo_db():
    client = MongoClient(settings.MONGO_URI)
    db = client.get_default_database()
    return db


# --- 카드번호 전처리: b→8, O→0 등 ---
def normalize_card_text(text):
    mapping = {
        "b": "8",
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


# --- 정규표현식 및 키워드 ---
PHONE_PATTERN = re.compile(r"\b(0\d{1,2})[- ]?(\d{3,4})[- ]?(\d{4})\b")
SSN_PATTERN = re.compile(r"\b(\d{6})[- ]?(\d{7})\b")

# 카드번호 패턴(전처리된 상태에서):
#  - 최대 4그룹(예: 5461-1211-****-****)
#  - 2그룹만 있어도 (예: 5461-1211) 카드번호로 간주
CARD_PATTERN = re.compile(
    r"\b(?:[\d\*]{4})(?:[-\s]+(?:[\d\*]{4})){1,3}\b", re.IGNORECASE  # 2~4그룹
)

ID_PW_KEYWORDS = ["id", "아이디", "pw", "비밀번호"]
SENSITIVE_KEYWORDS = ["신분증", "운전면허증", "여권", "명함", "노트"]

# 주소 느낌(예: "경기도 시흥시 관곡지로 222") 또는 "집주소" 포함
ADDRESS_REGEX = re.compile(
    r"(경기도|서울(?:특별시)?|부산(?:광역시)?|대구(?:광역시)?|인천(?:광역시)?|광주(?:광역시)?|대전(?:광역시)?|울산(?:광역시)?|세종(?:특별자치시)?|강원|충북|충남|전북|전남|경북|경남|제주)"
    r"\s*[가-힣0-9\s\-]+(?:로|길)\s*\d+",
    re.IGNORECASE,
)


@csrf_exempt
def blur_image(request):
    """
    POST로 전달된 photoId를 기반으로 MongoDB 분석 기록이 있는지 확인한 후,
    BASE_DIR/uploaded_images/{photoId}.jpg 파일에서 위험 요소를 재검출하고
    아래 기준에 따라 블러 처리합니다.

    - ID/PW, 주소 느낌(ADDRESS_REGEX/"집주소"), regions.json 지명, 카드번호(앞 2그룹만 있어도 포함) → 슈퍼 강한 블러(GaussianBlur radius=150)
    - 그 외(전화번호, 주민등록번호, 기타 민감 키워드), 바코드/QR → 일반 블러(GaussianBlur radius=50)
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST 요청만 허용됩니다."}, status=405)

    photoId = request.POST.get("photoId")
    if not photoId:
        return JsonResponse({"error": "photoId가 제공되지 않았습니다."}, status=400)

    # MongoDB 분석 기록 확인
    db = get_mongo_db()
    analysis_coll = db["analysis"]
    analysis_doc = analysis_coll.find_one({"photoId": photoId})
    if not analysis_doc:
        return JsonResponse(
            {"error": f"photoId {photoId}에 해당하는 분석 기록이 없습니다."},
            status=404,
        )

    # 이미지 파일 경로
    image_path = os.path.join(BASE_DIR, "uploaded_images", f"{photoId}.jpg")
    if not os.path.exists(image_path):
        return JsonResponse(
            {"error": f"이미지 파일을 찾을 수 없습니다: {image_path}"}, status=404
        )

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return JsonResponse({"error": f"이미지 로드 실패: {str(e)}"}, status=500)

    img_width, img_height = pil_image.size
    risk_boxes = []

    # 1. 바코드/QR 코드 영역 (pyzbar)
    try:
        codes = decode(pil_image)
        for code in codes:
            rect = code.rect
            x1 = rect.left
            y1 = rect.top
            x2 = rect.left + rect.width
            y2 = rect.top + rect.height
            # 바코드/QR은 일반 블러
            risk_boxes.append({"box": (x1, y1, x2, y2), "proc": "normal"})
    except Exception as e:
        print("Barcode/QR detection error:", e)

    # 2. 텍스트 영역 (Google Cloud Vision OCR)
    try:
        client = vision.ImageAnnotatorClient()
        vision_image = vision.Image(content=image_bytes)
        response = client.text_detection(image=vision_image)
        annotations = response.text_annotations

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

                # 1) ID/PW 관련
                if any(kw in lower_text for kw in [w.lower() for w in ID_PW_KEYWORDS]):
                    proc_type = "strong"
                    # 좌표 확장
                    expansion = 100
                    x1 = max(0, x1 - expansion)
                    y1 = max(0, y1 - expansion)
                    x2 = min(img_width, x2 + expansion)
                    y2 = min(img_height, y2 + expansion)

                # 2) 주소 느낌(정규식 or "집주소")
                elif ADDRESS_REGEX.search(detected_text) or "집주소" in lower_text:
                    proc_type = "strong"

                else:
                    # 3) 카드번호 인식 (전처리 후 short/full 패턴)
                    normalized_text = normalize_card_text(detected_text)
                    if re.search(CARD_PATTERN, normalized_text):
                        proc_type = "strong"

                    # 4) regions.json 지명 → 슈퍼 강한 블러
                    elif any(
                        r.lower() in lower_text
                        for r in [x.lower() for x in regions_from_file]
                    ):
                        proc_type = "strong"

                    # 5) 전화번호, 주민등록번호, 기타 민감 키워드
                    elif PHONE_PATTERN.search(detected_text) or SSN_PATTERN.search(
                        detected_text
                    ):
                        proc_type = "normal"
                    else:
                        for kw in SENSITIVE_KEYWORDS:
                            if kw in detected_text:
                                proc_type = "normal"
                                break

                if proc_type:
                    risk_boxes.append({"box": (x1, y1, x2, y2), "proc": proc_type})
    except Exception as e:
        print("Text detection error:", e)

    # 실제 블러 처리
    if not risk_boxes:
        print("위험 영역이 검출되지 않아 원본 이미지를 반환합니다.")
        final_image = pil_image
    else:
        final_image = pil_image.copy()
        for item in risk_boxes:
            x1, y1, x2, y2 = item["box"]
            proc = item["proc"]
            try:
                region = final_image.crop((x1, y1, x2, y2))
                if proc == "strong":
                    # 슈퍼 강한 블러 처리
                    blurred = region.filter(ImageFilter.GaussianBlur(radius=150))
                    final_image.paste(blurred, (x1, y1))
                else:
                    # normal
                    blurred = region.filter(ImageFilter.GaussianBlur(radius=50))
                    final_image.paste(blurred, (x1, y1))
            except Exception as e:
                print("영역 처리 오류:", e)

    output_buffer = io.BytesIO()
    final_image.save(output_buffer, format="JPEG")
    output_buffer.seek(0)
    return HttpResponse(output_buffer.getvalue(), content_type="image/jpeg")
