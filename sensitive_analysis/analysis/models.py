# analysis/models.py
from django.db import models


class Analysis(models.Model):
    analysis_id = models.AutoField(primary_key=True)
    photoId = models.CharField(max_length=20)  # 요청으로 받은 photoId (외래키 역할)
    userId = models.CharField(
        max_length=20, blank=True, null=True
    )  # 요청으로 받은 userId
    uploadTime = models.DateTimeField(blank=True, null=True)

    embedding = models.TextField(blank=True, null=True)  # VGG16 임베딩 (문자열)
    extracted_text = models.TextField(blank=True, null=True)  # OCR 결과
    risk_score = models.IntegerField(default=0)  # 총 위험 점수
    risk_level = models.CharField(
        max_length=20, blank=True
    )  # 위험 등급 ("낮음", "중간", "높음")
    risk_details = models.JSONField(
        blank=True, null=True
    )  # 민감정보 분석 세부 내역 (리스트)
    historical_inference_possible = models.BooleanField(default=False)
    historical_inference_details = models.JSONField(
        blank=True, null=True
    )  # 과거 추가 추론 결과 (리스트)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis"
        managed = True

    def __str__(self):
        return f"Analysis {self.analysis_id} (photoId={self.photoId})"
