import React, { useState, useEffect } from "react";
import { getHistory } from "../../api/auth.api";

const HistoryList = ({ onSelectHistory }) => {
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory();
        console.log("히스토리 데이터:", data); // 응답 데이터 확인
        setHistoryList(data);
      } catch (error) {
        console.error("히스토리 가져오기 실패:", error);
      }
    };
  
    fetchHistory();
  }, []);
  
  return (
    <div className="history-list">
      <h2>업로드 히스토리</h2>
      <ul>
        {historyList.map((item) => (
          <li key={item.photoId} onClick={() => onSelectHistory(item)}>
            {new Date(item.uploadedAt).toLocaleString()} {/* 업로드 시간 */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryList;
