import io
import re
import json
import os
import uuid
import numpy as np
from collections import Counter
from PIL import Image
from pyzbar.pyzbar import decode

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils import timezone

from pymongo import MongoClient

# Google Cloud Vision API 관련
from google.cloud import vision

# TensorFlow/Keras 관련 (사전 학습된 VGG16 사용)
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from tensorflow.keras.preprocessing import image as keras_image

# Analysis 모델은 필드명을 참고하기 위한 용도입니다.
from .models import Analysis

# BASE_DIR: manage.py가 있는 프로젝트 루트
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# regions.json 파일 로드 (프로젝트 루트에 위치)
REGIONS_FILE = os.path.join(BASE_DIR, "regions.json")
try:
    with open(REGIONS_FILE, "r", encoding="utf-8") as f:
        regions_from_file = json.load(f)
        print("Loaded regions:", regions_from_file)
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

# 전역: VGG16 모델 로딩 (include_top=False, pooling='avg')
model = VGG16(weights="imagenet", include_top=False, pooling="avg")


# MongoDB 연결 함수
def get_mongo_db():
    client = MongoClient(settings.MONGO_URI)
    db = client.get_default_database()  # URI에 지정된 DB ("PROSNS") 사용
    return db


# 1. 업로드된 이미지를 BASE_DIR/uploaded_images 폴더에 {photoId}.jpg로 저장
def save_uploaded_image(photoId, file_content):
    upload_folder = os.path.join(BASE_DIR, "uploaded_images")
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    file_path = os.path.join(upload_folder, f"{photoId}.jpg")
    with open(file_path, "wb") as f:
        f.write(file_content)
    return file_path


# 헬퍼 함수 0. 신용카드 번호 후보 추출 (OCR 오차 보정, '*' 허용)
def detect_credit_card_numbers(text):
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
    cc_pattern = re.compile(
        r"\b([\w*]{4})[- ]?([\w*]{4})[- ]?([\w*]{4})[- ]?([\w*]{4})\b"
    )
    candidates = []
    for groups in cc_pattern.findall(text):
        candidate_groups = []
        valid = True
        for group in groups:
            new_group = ""
            for ch in group:
                if ch.isdigit() or ch == "*":
                    new_group += ch
                elif ch in mapping:
                    new_group += mapping[ch]
                else:
                    valid = False
                    break
            if not valid or len(new_group) != 4:
                valid = False
                break
            candidate_groups.append(new_group)
        if valid:
            candidates.append(" ".join(candidate_groups))
    return candidates


# 헬퍼 함수 1. 이미지 임베딩 계산 (VGG16 이용)
def compute_embedding(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        x = keras_image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = preprocess_input(x)
        features = model.predict(x)
        features = features.flatten()
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm
        return features
    except Exception as e:
        print("Embedding computation error:", e)
        return None


def embedding_to_str(embedding):
    return ",".join(map(str, embedding.tolist()))


def str_to_embedding(embedding_str):
    try:
        return np.array(list(map(float, embedding_str.split(","))))
    except Exception as e:
        print("Error converting embedding string:", e)
        return None


# 헬퍼 함수 2. OCR: Google Vision API를 이용한 텍스트 추출
def extract_text_from_image(content):
    client = vision.ImageAnnotatorClient()
    image_vision = vision.Image(content=content)
    try:
        response = client.text_detection(image=image_vision)
        texts = response.text_annotations
        if texts:
            return texts[0].description
        return ""
    except Exception as e:
        print("OCR extraction error:", e)
        return ""


# 헬퍼 함수 3. 민감정보 분석 (텍스트 기반, ID/PW 포함)
def analyze_sensitive_text(text):
    score = 0
    details = []
    sensitive_keywords = ["신분증", "운전면허증", "여권", "명함", "노트"]
    for keyword in sensitive_keywords:
        if keyword in text:
            score += 20
            details.append(f"문서 관련 '{keyword}' 감지: 개인정보 노출 위험")
    phone_pattern = re.compile(r"\b(0\d{1,2})[- ]?(\d{3,4})[- ]?(\d{4})\b")
    phone_matches = phone_pattern.findall(text)
    if phone_matches:
        phone_numbers = ["".join(match) for match in phone_matches]
        score += 20 * len(phone_numbers)
        details.append(
            "전화번호 감지: " + ", ".join(phone_numbers) + " (연락처 정보 노출 위험)"
        )
    ssn_pattern = re.compile(r"\b(\d{6})[- ]?(\d{7})\b")
    ssn_matches = ssn_pattern.findall(text)
    if ssn_matches:
        ssn_numbers = ["".join(match) for match in ssn_matches]
        score += 30 * len(ssn_numbers)
        details.append(
            "주민등록번호 감지: " + ", ".join(ssn_numbers) + " (매우 민감한 정보 노출)"
        )
    cc_numbers = detect_credit_card_numbers(text)
    if cc_numbers:
        score += 25 * len(cc_numbers)
        details.append(
            "신용카드 번호 감지: " + ", ".join(cc_numbers) + " (금융정보 노출 위험)"
        )
    id_keywords = ["ID", "아이디"]
    pw_keywords = ["PW", "비밀번호"]
    for kw in id_keywords:
        if kw in text:
            score += 15
            details.append(f"개인정보({kw}) 감지: 노출 위험")
            break
    for kw in pw_keywords:
        if kw in text:
            score += 15
            details.append(f"개인정보({kw}) 감지: 노출 위험")
            break
    # 지역명 감지: regions.json에 있는 각 지역이 텍스트에 한 번이라도 발견되면 +10점 (중복 무시)
    detected_regions = []
    for region in regions_from_file:
        if region in text and region not in detected_regions:
            detected_regions.append(region)
    if detected_regions:
        score += 10 * len(detected_regions)
        details.append(
            "지역명 감지: " + ", ".join(detected_regions) + " (지역 정보 노출 위험)"
        )
    return score, details


# 헬퍼 함수 4. 비주얼 분석: 랜드마크 및 라벨 감지
def analyze_visual_elements(content):
    client = vision.ImageAnnotatorClient()
    image_vision = vision.Image(content=content)
    score = 0
    details = []
    try:
        landmark_response = client.landmark_detection(image=image_vision)
        if landmark_response.landmark_annotations:
            landmark_names = [
                landmark.description
                for landmark in landmark_response.landmark_annotations
            ]
            score += 15
            details.append(
                f"랜드마크 감지: {', '.join(landmark_names)} (위치 유추 가능)"
            )
    except Exception as e:
        print("Landmark detection error:", e)
    try:
        label_response = client.label_detection(image=image_vision)
        if label_response.label_annotations:
            label_descriptions = [
                label.description for label in label_response.label_annotations
            ]
            if any(
                "신용카드" in label or "credit card" in label
                for label in label_descriptions
            ):
                score += 25
                details.append("신용카드 항목 감지 (라벨 분석): 금융정보 노출 위험")
    except Exception as e:
        print("Label detection error:", e)
    return score, details


# 헬퍼 함수 5. 바코드/QR 코드 검출
def analyze_barcode_qr(content):
    score = 0
    details = []
    try:
        pil_image = Image.open(io.BytesIO(content))
        codes = decode(pil_image)
        if codes:
            score += 10
            details.append("바코드/QR 코드 감지: 추가 정보 접근 가능")
    except Exception as e:
        print("Barcode/QR detection error:", e)
    return score, details


# 헬퍼 함수 6. 임베딩 기반 추가 추론
def infer_context_from_embeddings(current_embedding):
    """
    현재 이미지의 임베딩과 MongoDB에 저장된 이전 이미지들의 임베딩을 비교하여,
    코사인 유사도(두 벡터의 내적 값)가 threshold보다 크면, (유사도 - threshold)*50의 위험 점수를 추가합니다.
    """
    if current_embedding is None:
        return 0, []
    threshold = 0.7  # 유사도 임계값 (필요 시 조정)
    additional_score = 0
    additional_details = []
    db = get_mongo_db()
    analysis_coll = db["analysis"]
    similar_similarities = []
    for doc in analysis_coll.find({"embedding": {"$ne": ""}}):
        try:
            stored_embedding = np.array(list(map(float, doc["embedding"].split(","))))
            similarity = np.dot(
                current_embedding, stored_embedding
            )  # 정규화된 임베딩의 내적 = 코사인 유사도
            if similarity > threshold:
                points = (similarity - threshold) * 50  # 유사도에 따른 위험 점수 부여
                additional_score += points
                similar_similarities.append(round(similarity, 2))
        except Exception as e:
            print("Error in embedding comparison:", e)
            continue
    if similar_similarities:
        additional_details.append(
            f"임베딩 기반 유사 이미지 (유사도: {similar_similarities})로 추가 위험 점수 {round(additional_score,1)}점 부여"
        )
    return int(additional_score), additional_details


# 기존 텍스트 기반 추가 추론 함수
def infer_context_from_history_extended(current_visual_details):
    inferred_score = 0
    inferred_details = []
    current_locations = []
    for detail in current_visual_details:
        if detail.startswith("랜드마크 감지:"):
            ls = detail.split(":", 1)[-1].strip()
            current_locations.extend([x.strip() for x in ls.split(",")])
        elif detail.startswith("지역명 감지:"):
            ls = detail.split(":", 1)[-1].strip()
            current_locations.extend([x.strip() for x in ls.split(",")])
    if not current_locations:
        return inferred_score, inferred_details
    all_locations = []
    previous_analyses = Analysis.objects.exclude(risk_details__isnull=True)
    for analysis in previous_analyses:
        try:
            risk_details_list = analysis.risk_details if analysis.risk_details else []
            for d in risk_details_list:
                if d.startswith("랜드마크 감지:") or d.startswith("지역명 감지:"):
                    ls = d.split(":", 1)[-1].strip()
                    all_locations.extend([x.strip() for x in ls.split(",")])
        except Exception:
            continue
    if not all_locations:
        return inferred_score, inferred_details
    from collections import Counter

    location_counts = Counter(all_locations)
    frequent_locations = {loc for loc, count in location_counts.items() if count >= 2}
    common = set(current_locations).intersection(frequent_locations)
    if common:
        inferred_score += 10
        inferred_details.append(
            f"과거 이미지에서 자주 등장하는 장소/지역 ({', '.join(common)})가 현재 이미지에도 감지됨: 개인정보 노출 위험 증가"
        )
    return inferred_score, inferred_details


##############################################################################
# 메인 뷰: 이미지 분석 및 MongoDB의 analysis 컬렉션에 저장
##############################################################################
@csrf_exempt
def analyze_image(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST 요청만 허용됩니다."}, status=405)

    image_file = request.FILES.get("image")
    if not image_file:
        return JsonResponse({"error": "이미지가 업로드되지 않았습니다."}, status=400)

    file_content = image_file.read()
    if not file_content:
        return JsonResponse({"error": "업로드된 파일이 비어 있습니다."}, status=400)

    # photoId와 userId는 POST 요청에서 "photoId"와 "userId"로 받음
    photoId = request.POST.get("photoId")
    if not photoId:
        photoId = str(uuid.uuid4())[:8]
    userId = request.POST.get("userId", "")

    # 이미지 파일을 BASE_DIR/uploaded_images 폴더에 {photoId}.jpg 로 저장
    save_uploaded_image(photoId, file_content)
    photoUrl = f"/uploaded_images/{photoId}.jpg"  # 웹 접근 URL
    photoName = image_file.name  # 사용하지 않음
    uploadTime = timezone.now()

    total_risk_score = 0
    risk_details = []

    extracted_text = extract_text_from_image(file_content)

    text_score, text_details = analyze_sensitive_text(extracted_text)
    total_risk_score += text_score
    risk_details.extend(text_details)

    visual_score, visual_details = analyze_visual_elements(file_content)
    total_risk_score += visual_score
    risk_details.extend(visual_details)

    barcode_score, barcode_details = analyze_barcode_qr(file_content)
    total_risk_score += barcode_score
    risk_details.extend(barcode_details)

    new_embedding = compute_embedding(file_content)
    if new_embedding is None:
        risk_details.append("이미지 임베딩 추출 실패")

    text_infer_score, text_infer_details = infer_context_from_history_extended(
        visual_details
    )
    total_risk_score += text_infer_score
    risk_details.extend(text_infer_details)

    embed_infer_score, embed_infer_details = infer_context_from_embeddings(
        new_embedding
    )
    total_risk_score += embed_infer_score
    risk_details.extend(embed_infer_details)

    if request.user.is_authenticated:
        registered_phone = getattr(request.user, "phone_number", None)
        if registered_phone:
            if registered_phone in extracted_text:
                total_risk_score += 20
                risk_details.append(
                    f"등록된 전화번호 노출: {registered_phone} (가입 시 입력한 전화번호가 이미지에 포함됨)"
                )
            else:
                risk_details.append(
                    "등록된 전화번호 미노출: 가입 시 입력한 전화번호가 이미지에 포함되지 않음"
                )

    historical_inference_possible = bool(text_infer_details or embed_infer_details)

    if total_risk_score > 100:
        total_risk_score = 100
    if total_risk_score < 30:
        risk_level = "낮음"
    elif total_risk_score < 70:
        risk_level = "중간"
    else:
        risk_level = "높음"

    analysis_doc = {
        "photoId": photoId,
        "embedding": (
            embedding_to_str(new_embedding) if new_embedding is not None else ""
        ),
        "extracted_text": extracted_text,
        "risk_score": total_risk_score,
        "risk_level": risk_level,
        "risk_details": risk_details,
        "historical_inference_possible": historical_inference_possible,
        "historical_inference_details": text_infer_details + embed_infer_details,
        "userId": userId,
        "uploadTime": uploadTime,
        "created_at": timezone.now(),
    }

    db = get_mongo_db()
    analysis_coll = db["analysis"]
    result_insert = analysis_coll.insert_one(analysis_doc)
    analysis_id = str(result_insert.inserted_id)

    result = {
        "photoId": photoId,
        "analysis_id": analysis_id,
        "risk_score": total_risk_score,
        "risk_level": risk_level,
        "risk_details": risk_details,
        "extracted_text": extracted_text,
        "historical_inference": {
            "possible": historical_inference_possible,
            "details": text_infer_details + embed_infer_details,
        },
    }
    return JsonResponse(result)
