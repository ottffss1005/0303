# privacy_checker/views.py
import io
import re
import json
import base64
import os
import uuid
import requests
import numpy as np
from collections import Counter
from PIL import Image
from pyzbar.pyzbar import decode

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from django.conf import settings

# Google Cloud Vision API 관련
from google.cloud import vision

# TensorFlow/Keras 관련 (사전 학습된 VGG16 사용)
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from tensorflow.keras.preprocessing import image as keras_image

# 새 모델 임포트: Photo와 Analysis (새로운 모델)
from .models import Photo, Analysis

# 외부 파일에서 지역명 리스트 로드 (regions.json 파일)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGIONS_FILE = os.path.join(BASE_DIR, "regions.json")
try:
    with open(REGIONS_FILE, "r", encoding="utf-8") as f:
        regions_from_file = json.load(f)
except Exception as e:
    print("Trying to load region file from:", REGIONS_FILE)
    print("regions.json 로드 실패:", e)
    regions_from_file = [
        "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
        "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
    ]

# 전역: VGG16 모델 로딩
model = VGG16(weights="imagenet", include_top=False, pooling="avg")


# 헬퍼 함수 0. 신용카드 번호 후보 추출 (오차 보정 포함)
def detect_credit_card_numbers(text):
    mapping = {
        "b": "8", "B": "8",
        "O": "0", "o": "0",
        "I": "1", "l": "1",
        "S": "5", "s": "5",
        "Z": "2", "z": "2",
    }
    cc_pattern = re.compile(r"\b([\w]{4})[- ]?([\w]{4})[- ]?([\w]{4})[- ]?([\w]{4})\b")
    candidates = []
    for groups in cc_pattern.findall(text):
        candidate_groups = []
        valid = True
        for group in groups:
            new_group = ""
            non_digit_count = 0
            for ch in group:
                if ch.isdigit():
                    new_group += ch
                else:
                    if ch in mapping:
                        new_group += mapping[ch]
                        non_digit_count += 1
                    else:
                        valid = False
                        break
            if not valid or len(new_group) != 4 or non_digit_count > 1:
                valid = False
                break
            candidate_groups.append(new_group)
        if valid:
            card_number = " ".join(candidate_groups)
            candidates.append(card_number)
    return candidates


# 헬퍼 함수 1. 이미지 임베딩 계산 (VGG16 이용)
def compute_embedding(image_bytes):
    try:
        # 새 BytesIO 객체 생성
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


# 헬퍼 함수 3. 민감정보 분석 (엄격한 검출)
def analyze_sensitive_text(text):
    score = 0
    details = []

    sensitive_keywords = ["신분증", "운전면허증", "여권", "명함", "노트"]
    for keyword in sensitive_keywords:
        if keyword in text:
            score += 20
            details.append(f"문서 관련 '{keyword}' 키워드 감지: 문서 또는 개인정보 노출 가능")

    phone_pattern = re.compile(r"\b(01[016789])[- ]?(\d{3,4})[- ]?(\d{4})\b")
    phone_matches = phone_pattern.findall(text)
    if phone_matches:
        phone_numbers = ["".join(match) for match in phone_matches]
        score += 20 * len(phone_numbers)
        details.append("전화번호 감지: " + ", ".join(phone_numbers) + " (개인 연락처 정보 노출 위험)")

    ssn_pattern = re.compile(r"\b(\d{6})[- ]?(\d{7})\b")
    ssn_matches = ssn_pattern.findall(text)
    if ssn_matches:
        ssn_numbers = ["".join(match) for match in ssn_matches]
        score += 30 * len(ssn_numbers)
        details.append("주민등록번호 감지: " + ", ".join(ssn_numbers) + " (극히 민감한 개인정보 노출)")

    cc_numbers = detect_credit_card_numbers(text)
    if cc_numbers:
        score += 25 * len(cc_numbers)
        details.append("신용카드 번호 감지: " + ", ".join(cc_numbers) + " (금융정보 노출 위험)")

    detected_regions = []
    for region in regions_from_file:
        if region in text and region not in detected_regions:
            detected_regions.append(region)
    if detected_regions:
        score += 20 * len(detected_regions)
        details.append("지역명 감지: " + ", ".join(detected_regions) +
                       " (특정 지역 정보 노출로 개인 생활 패턴 유추 가능)")
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
            landmark_names = [landmark.description for landmark in landmark_response.landmark_annotations]
            score += 15
            details.append(f"랜드마크(위치) 감지: {', '.join(landmark_names)} (해당 장소를 통해 위치 유추 가능)")
    except Exception as e:
        print("Landmark detection error:", e)
    try:
        label_response = client.label_detection(image=image_vision)
        if label_response.label_annotations:
            label_descriptions = [label.description for label in label_response.label_annotations]
            if any("신용카드" in label or "credit card" in label for label in label_descriptions):
                score += 25
                details.append("신용카드 관련 항목 감지 (라벨 분석): 금융정보 노출 위험")
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
            details.append("바코드 또는 QR 코드 감지: 해당 코드를 통해 추가 정보 접근 가능")
    except Exception as e:
        print("Barcode/QR detection error:", e)
    return score, details


# 헬퍼 함수 6. 과거 Analysis 내역을 통한 추가 추론
def infer_context_from_history_extended(current_visual_details):
    inferred_score = 0
    inferred_details = []
    current_landmarks = []
    for detail in current_visual_details:
        if detail.startswith("랜드마크(위치) 감지:"):
            landmarks_str = detail.split(":", 1)[-1].strip()
            landmarks = [land.strip() for land in landmarks_str.split(",")]
            current_landmarks.extend(landmarks)
    if not current_landmarks:
        return inferred_score, inferred_details
    all_landmarks = []
    previous_analyses = Analysis.objects.exclude(analysis_details__isnull=True)
    for analysis in previous_analyses:
        try:
            parsed = json.loads(analysis.analysis_details)
            risk_details = parsed.get("risk_details", [])
            for d in risk_details:
                if d.startswith("랜드마크(위치) 감지:"):
                    ls = d.split(":", 1)[-1].strip()
                    lands = [x.strip() for x in ls.split(",")]
                    all_landmarks.extend(lands)
        except Exception:
            continue
    if not all_landmarks:
        return inferred_score, inferred_details
    landmark_counts = Counter(all_landmarks)
    frequent_landmarks = {land for land, count in landmark_counts.items() if count >= 2}
    common = set(current_landmarks).intersection(frequent_landmarks)
    if common:
        inferred_score += 10
        inferred_details.append(
            f"과거 이미지에서 자주 등장하는 장소 ({', '.join(common)})가 현재 이미지에도 감지됨: "
            "해당 장소는 개인의 주거지나 사무실 등으로 추정되어 개인정보 노출 위험이 증가합니다."
        )
    return inferred_score, inferred_details


# 메인 뷰: 이미지 분석, Photo 및 Analysis 저장, 추가 추론 및 사용자 전화번호 노출 확인
@csrf_exempt
def analyze_image(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST 요청만 허용됩니다."}, status=405)
    
    image_file = request.FILES.get("image")
    if not image_file:
        return JsonResponse({"error": "이미지가 업로드되지 않았습니다."}, status=400)
    
    # 파일 내용 한 번 읽기
    file_content = image_file.read()
    if not file_content:
        return JsonResponse({"error": "업로드된 파일이 비어 있습니다."}, status=400)
    
    # photo_id 처리: POST 데이터에서 받아오거나, 없으면 랜덤 생성
    photo_id = request.POST.get("photo_id")
    if not photo_id:
        photo_id = str(uuid.uuid4())[:8]
    
    # Photo 객체 생성 또는 가져오기 (파일 저장: ContentFile 사용)
    photo_obj, created = Photo.objects.get_or_create(
        photo_id=photo_id,
        defaults={"image": ContentFile(file_content, name=image_file.name)}
    )
    
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
    
    infer_score_ext, infer_details_ext = infer_context_from_history_extended(visual_details)
    total_risk_score += infer_score_ext
    risk_details.extend(infer_details_ext)
    
    if request.user.is_authenticated:
        registered_phone = getattr(request.user, "phone_number", None)
        if registered_phone:
            if registered_phone in extracted_text:
                total_risk_score += 20
                risk_details.append(
                    f"등록된 전화번호 노출: {registered_phone} (가입 시 입력한 전화번호가 이미지에 포함되어 있음)"
                )
            else:
                risk_details.append(
                    "등록된 전화번호 미노출: 가입 시 입력한 전화번호가 이미지에 포함되어 있지 않음"
                )
    
    historical_inference_possible = bool(infer_details_ext)
    
    if total_risk_score > 100:
        total_risk_score = 100
    if total_risk_score < 30:
        risk_level = "낮음"
    elif total_risk_score < 70:
        risk_level = "중간"
    else:
        risk_level = "높음"
    
    analysis_summary = {"extracted_text": extracted_text, "risk_details": risk_details}
    analysis_summary_str = json.dumps(analysis_summary, ensure_ascii=False)
    
    # Analysis 객체 생성 (Photo를 외래키로 연결)
    analysis_obj = Analysis.objects.create(
        photo=photo_obj,
        embedding=embedding_to_str(new_embedding) if new_embedding is not None else "",
        extracted_text=extracted_text,
        risk_score=total_risk_score,
        risk_level=risk_level,
        analysis_details=analysis_summary_str,
    )
    
    result = {
        "photo_id": photo_id,
        "analysis_id": analysis_obj.analysis_id,
        "risk_score": total_risk_score,
        "risk_level": risk_level,
        "risk_details": risk_details,
        "extracted_text": extracted_text,
        "historical_inference": {
            "possible": historical_inference_possible,
            "details": infer_details_ext,
        },
    }
    return JsonResponse(result)
