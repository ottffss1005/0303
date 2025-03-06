# 250225 수정 사항
- 이미지 분석 기능 프로토타입 제작

##  프로토타입 작동 방식
1. models.py를 통해 사진을 저장하는 photo 테이블과 photo_id를 외래키로 갖는 analysis 테이블 생성
2. /api/analyze 엔드포인트로 POST 메소드로 사진을 보내면 사진을 분석하고, 테이블에 정보를 저장한다.

![alt text](./readmeimg/image.png)
![alt text](./readmeimg/image1.png)