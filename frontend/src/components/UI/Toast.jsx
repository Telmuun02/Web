import CheckOutlined from '@mui/icons-material/CheckOutlined'
import './Toast.css'

// Амжилттай болсон үйлдлийн ногоон мэдэгдэл.
// Текст хоосон (эсвэл false) бол юу ч харуулахгүй — хуудас дээр {toast && …} гэж шалгах шаардлагагүй
export default function Toast({ children }) {
  if (!children) return null

  return (
    <div className="ui-toast" role="status">
      <CheckOutlined sx={{ fontSize: 18 }} />
      {children}
    </div>
  )
}
