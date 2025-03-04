# analysis/models.py
from django.db import models

class Analysis(models.Model):
    analysis_id = models.AutoField(primary_key=True)
    photo_id = models.CharField(
        max_length=20
    )  # 기존 Photo 테이블의 photo_id (외래키로 활용)

    embedding = models.TextField(blank=True, null=True)
    extracted_text = models.TextField(blank=True, null=True)
    risk_score = models.IntegerField(default=0)
    risk_level = models.CharField(max_length=20, blank=True)
    risk_details = models.JSONField(blank=True, null=True)
    historical_inference_possible = models.BooleanField(default=False)
    historical_inference_details = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis"
        managed = True

    def __str__(self):
        return f"Analysis {self.analysis_id} (photo_id={self.photo_id})"
