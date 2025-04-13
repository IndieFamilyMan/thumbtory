"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/store/editor";

export function Canvas() {
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("캔버스 컴포넌트 임시 버전");

  useEffect(() => {
    console.log("임시 캔버스 컴포넌트가 마운트됨");

    // 에디터 스토어에 더미 캔버스 설정
    if (typeof useEditorStore.getState().setCanvas === "function") {
      // 더미 캔버스 객체 생성
      const dummyCanvas = {
        renderAll: () => console.log("renderAll called"),
        toDataURL: () => "data:image/png;base64,",
        getObjects: () => [],
        on: () => {},
        // 기타 필요한 메서드
      };

      useEditorStore.getState().setCanvas(dummyCanvas);
    }

    return () => {
      console.log("임시 캔버스 컴포넌트가 언마운트됨");
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "4px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h3>캔버스 컴포넌트 수리 중</h3>
        <p>캔버스 기능이 곧 복구될 예정입니다.</p>
        <p>잠시만 기다려 주세요.</p>
        <pre>{message}</pre>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ display: "none" }}
      />
    </div>
  );
}

// 함수 컴포넌트 외부에 React 훅을 사용하지 않아야 함
