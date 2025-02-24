# analysis/models.py
from django.db import models
import uuid

class Photo(models.Model):
    """
    photo_id를 직접 primary key로 사용합니다.
    사진 파일과 생성 일시 등을 저장.
    """
    photo_id = models.CharField(max_length=20, primary_key=True)
    image = models.ImageField(upload_to='uploaded_images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo {self.photo_id} ({self.created_at})"


class Analysis(models.Model):
    """
    Analysis 테이블에서 photo_id를 외래키로 받아, 
    해당 사진의 분석 결과를 저장합니다.
    """
    analysis_id = models.AutoField(primary_key=True)  # 분석 결과 식별자
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE)  # photo_id 참조
    embedding = models.TextField(blank=True, null=True)
    extracted_text = models.TextField(blank=True, null=True)
    risk_score = models.IntegerField(default=0)
    risk_level = models.CharField(max_length=20, blank=True)
    analysis_details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis {self.analysis_id} for Photo {self.photo_id}"
