import React from "react";
import ChatBubble from "./ChatBubble";

const AIquestion = () => {
  return (
    <div>
        <ChatBubble message="사진을 분석해 드릴까요?"
        sender="AI" type="text" />
    </div>
  );
};

export default AIquestion;
