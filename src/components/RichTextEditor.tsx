import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  RemoveFormat,
  FontFamily,
  FontSize,
  FontColor,
  FontBackgroundColor,
  List,
  Indent,
  IndentBlock,
  Alignment,
  Link,
  Image,
  ImageInsertViaUrl,
  ImageUpload,
  ImageStyle,
  ImageToolbar,
  ImageCaption,
  ImageTextAlternative,
  Table,
  TableToolbar,
  HorizontalLine,
  SpecialCharacters,
  SpecialCharactersEssentials,
  BlockQuote,
  FileRepository,
  Notification as CKNotification,
  type UploadAdapter,
  type FileLoader,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
// Style cho nội dung soạn thảo (list-style ol/ul, spacing bảng, blockquote...) nằm
// riêng ở file này — ckeditor5.css chỉ có UI chrome (toolbar/dropdown), thiếu file
// này thì list không hiện số/chấm vì Tailwind Preflight đã reset list-style: none.
import "ckeditor5/ckeditor5-content.css";
import { useToast } from "@/hooks/useToast";
import { uploadImage } from "@/lib/upload-api";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Upload ảnh lên server qua API /upload/image sẵn có (giống ImageUploader) rồi nhúng
// URL trả về vào nội dung — không nhúng base64 thẳng vào HTML (payload mô tả sẽ phình
// to tới vài MB/ảnh nếu nhúng base64). Viết tay theo đúng pattern "custom upload
// adapter" chính thức của CKEditor vì Base64UploadAdapter có sẵn không cho chỗ chèn validate.
class ServerFileUploadAdapter implements UploadAdapter {
  private loader: FileLoader;

  constructor(loader: FileLoader) {
    this.loader = loader;
  }

  upload(): Promise<{ default: string }> {
    return this.loader.file.then((file) => {
      if (!file) {
        return Promise.reject("Không đọc được file ảnh.");
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return Promise.reject("Chỉ chấp nhận ảnh định dạng .jpg, .jpeg, .png, .webp");
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return Promise.reject("Ảnh vượt quá dung lượng cho phép (5MB)");
      }
      return uploadImage(file)
        .then((result) => ({ default: result.url }))
        .catch(() => Promise.reject("Upload ảnh thất bại"));
    });
  }

  abort() {}
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, disabled = false }: RichTextEditorProps) {
  const toast = useToast();

  return (
    // Không tự vẽ border/rounded ở div ngoài — CKEditor đã tự vẽ border + bo góc riêng
    // cho toolbar (.ck-sticky-panel__content, bo trên) và vùng nội dung
    // (.ck-editor__editable, bo dưới) khớp nhau thành 1 khối liền mạch. Thêm border ở
    // đây sẽ chồng lên border CKEditor tự vẽ, nhìn dày hơn 1px thật.
    <div className="ck-content-wrapper">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          licenseKey: "GPL",
          plugins: [
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Subscript,
            Superscript,
            RemoveFormat,
            FontFamily,
            FontSize,
            FontColor,
            FontBackgroundColor,
            List,
            Indent,
            IndentBlock,
            Alignment,
            Link,
            Image,
            ImageInsertViaUrl,
            ImageUpload,
            ImageStyle,
            ImageToolbar,
            ImageCaption,
            ImageTextAlternative,
            Table,
            TableToolbar,
            HorizontalLine,
            SpecialCharacters,
            SpecialCharactersEssentials,
            BlockQuote,
          ],
          toolbar: [
            "undo",
            "redo",
            "|",
            "heading",
            "|",
            "fontFamily",
            "fontSize",
            "|",
            "fontColor",
            "fontBackgroundColor",
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "subscript",
            "superscript",
            "removeFormat",
            "|",
            "bulletedList",
            "numberedList",
            "outdent",
            "indent",
            "|",
            "alignment",
            "|",
            "link",
            "insertImage",
            "insertTable",
            "horizontalLine",
            "specialCharacters",
            "|",
            "blockQuote",
          ],
          fontSize: {
            options: [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48],
            supportAllValues: true,
          },
          image: {
            toolbar: ["imageTextAlternative", "toggleImageCaption", "|", "imageStyle:inline", "imageStyle:block"],
            upload: {
              types: ["jpeg", "jpg", "png", "webp"],
            },
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
        }}
        onReady={(editor) => {
          editor.plugins.get(FileRepository).createUploadAdapter = (loader) =>
            new ServerFileUploadAdapter(loader);

          // CKEditor mặc định fallback qua window.alert() cho warning chưa ai xử lý
          // (xem doc-comment của Notification#init trong @ckeditor/ckeditor5-ui) — evt.stop()
          // ở priority cao hơn để thay bằng useToast() sẵn có của CMS, đúng convention CLAUDE.md.
          // Notification thực tế mixin Emitter qua ContextPluginBase (runtime có .on()), nhưng
          // .d.ts bundle của gói này không lộ ra field đó nên phải ép kiểu hẹp ở đúng chỗ gọi.
          (
            editor.plugins.get(CKNotification) as unknown as {
              on(
                event: "show:warning",
                callback: (evt: { stop(): void }, data: { message: string }) => void,
                options: { priority: "high" },
              ): void;
            }
          ).on(
            "show:warning",
            (evt, data) => {
              evt.stop();
              toast.error(data.message);
            },
            { priority: "high" },
          );
        }}
        onChange={(_event, editor) => onChange(editor.getData())}
        disabled={disabled}
      />
    </div>
  );
}
