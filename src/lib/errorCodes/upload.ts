// Khớp CHÍNH XÁC giá trị số với backend-cms/src/common/constants/error-codes/upload.ts.
export const UploadErrorCode = {
  UPLOAD_INVALID_PUBLIC_ID: 1901,
  UPLOAD_IMAGE_FILE_REQUIRED: 1902,
  UPLOAD_VIDEO_FILE_REQUIRED: 1903,
  UPLOAD_IMAGE_INVALID_TYPE: 1904,
  UPLOAD_VIDEO_INVALID_TYPE: 1905,
} as const;

export const UPLOAD_ERROR_MESSAGE: Partial<
  Record<(typeof UploadErrorCode)[keyof typeof UploadErrorCode], string>
> = {
  [UploadErrorCode.UPLOAD_INVALID_PUBLIC_ID]: "publicId không hợp lệ.",
  [UploadErrorCode.UPLOAD_IMAGE_FILE_REQUIRED]: "Vui lòng chọn file ảnh để upload.",
  [UploadErrorCode.UPLOAD_VIDEO_FILE_REQUIRED]: "Vui lòng chọn file video để upload.",
  [UploadErrorCode.UPLOAD_IMAGE_INVALID_TYPE]:
    "Chỉ chấp nhận ảnh định dạng .jpg, .jpeg, .png, .webp.",
  [UploadErrorCode.UPLOAD_VIDEO_INVALID_TYPE]: "Chỉ chấp nhận video định dạng .mp4, .webm.",
};
