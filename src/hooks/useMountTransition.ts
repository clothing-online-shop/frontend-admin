import { useEffect, useState } from "react";

interface MountTransitionState {
  /** Còn phải render trong DOM không (true suốt lúc mở + trong lúc đang chạy animation đóng). */
  shouldRender: boolean;
  /** Có nên áp class trạng thái "mở" chưa — trễ 1 frame so với `shouldRender` khi mở, để
   * trình duyệt kịp paint trạng thái "đóng" trước, nếu không CSS transition sẽ không chạy
   * (mount thẳng ở trạng thái cuối thì không có gì để transition từ đó). */
  isVisible: boolean;
}

/**
 * Giữ component mount thêm `exitDurationMs` sau khi `isOpen` chuyển false để CSS transition
 * đóng (fade/scale...) kịp chạy hết trước khi React gỡ khỏi DOM, đồng thời trễ 1 frame khi
 * mở để transition mở cũng chạy đúng thay vì mount thẳng vào trạng thái cuối.
 * Dùng cho Modal/dropdown panel thay vì `if (!isOpen) return null`.
 */
export function useMountTransition(isOpen: boolean, exitDurationMs = 150): MountTransitionState {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    let raf: number;
    let timeout: ReturnType<typeof setTimeout>;

    if (isOpen) {
      setShouldRender(true);
      raf = requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeout = setTimeout(() => setShouldRender(false), exitDurationMs);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [isOpen, exitDurationMs]);

  return { shouldRender, isVisible };
}
