/**
 * 이미지 다운로드 유틸리티 함수
 * @param {string} dataUrl - 다운로드할 이미지의 data URL
 * @param {string} filename - 저장할 파일 이름
 */
export const downloadImage = (dataUrl, filename) => {
  try {
    // 파일 이름에 확장자가 없으면 기본 png 추가
    if (!filename.match(/\.(png|jpe?g|webp)$/i)) {
      filename += ".png";
    }

    // a 태그 생성 후 다운로드 속성 설정
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;

    // DOM에 요소 추가, 클릭 이벤트 발생, 제거
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("이미지 다운로드 중 오류 발생:", error);
    return false;
  }
};

/**
 * 지정된 사이즈로 이미지를 크롭하여 다운로드
 * @param {string} dataUrl - 원본 이미지 data URL
 * @param {object} options - 크롭 옵션 (left, top, width, height)
 * @param {string} filename - 저장할 파일 이름
 */
export const cropAndDownloadImage = (dataUrl, options, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // 캔버스 생성
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // 캔버스 크기 설정
        canvas.width = options.width || img.width;
        canvas.height = options.height || img.height;

        // 이미지 크롭 및 그리기
        ctx.drawImage(
          img,
          options.left || 0,
          options.top || 0,
          options.width || img.width,
          options.height || img.height,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // 결과 이미지 생성
        const croppedDataUrl = canvas.toDataURL("image/png");

        // 다운로드
        downloadImage(croppedDataUrl, filename);
        resolve(croppedDataUrl);
      };

      img.onerror = (error) => {
        console.error("이미지 로드 중 오류:", error);
        reject(error);
      };

      img.src = dataUrl;
    } catch (error) {
      console.error("이미지 크롭 중 오류:", error);
      reject(error);
    }
  });
};

/**
 * 이미지 중앙의 1:1 비율 영역만 크롭하여 다운로드
 * @param {string} dataUrl - 원본 이미지 data URL
 * @param {string} filename - 저장할 파일 이름
 */
export const cropCenterSquareAndDownload = (dataUrl, filename) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const minSize = Math.min(img.width, img.height);
        const left = (img.width - minSize) / 2;
        const top = (img.height - minSize) / 2;

        cropAndDownloadImage(
          dataUrl,
          { left, top, width: minSize, height: minSize },
          filename
        )
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
};
