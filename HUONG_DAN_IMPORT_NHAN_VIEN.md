# HƯỚNG DẪN NHẬP NHÂN VIÊN HÀNG LOẠT

## Format File Excel

File Excel cần có các cột sau với tên cột bằng **TIẾNG VIỆT** (có dấu):

### CÁC CỘT BẮT BUỘC:
1. **Họ và tên đệm** - Họ và tên đệm của nhân viên (bắt buộc)
2. **Tên** - Tên của nhân viên (bắt buộc)
3. **Email** - Email (bắt buộc, phải là email hợp lệ và duy nhất)
4. **Mã nhân viên** - Mã nhân viên (bắt buộc, phải là duy nhất, không trùng)
5. **Chức vụ** - Chức vụ/Vị trí công việc (bắt buộc)
6. **Phòng ban** - Tên phòng ban (bắt buộc, phải khớp chính xác với tên phòng ban trong hệ thống)

### CÁC CỘT TÙY CHỌN:
- **Số điện thoại** - Số điện thoại liên hệ
- **Ngày sinh** - Ngày sinh (định dạng: YYYY-MM-DD hoặc DD/MM/YYYY)
- **Giới tính** - Giới tính (male, female, other)
- **Loại hợp đồng** - Loại hợp đồng (full-time, part-time, contract, intern)
- **Ngày bắt đầu** - Ngày bắt đầu làm việc (định dạng: YYYY-MM-DD hoặc DD/MM/YYYY)
- **Lương** - Mức lương (số)
- **Chu kỳ lương** - Chu kỳ trả lương (weekly, bi-weekly, monthly, annually)
- **Địa chỉ** - Địa chỉ
- **Thành phố** - Thành phố
- **Tỉnh/Thành** - Tỉnh/Thành phố
- **Mã bưu điện** - Mã bưu điện
- **Quốc gia** - Quốc tịch

## Ví dụ File Excel:

| Họ và tên đệm | Tên | Email | Mã nhân viên | Chức vụ | Phòng ban | Số điện thoại | Giới tính | Loại hợp đồng | Ngày bắt đầu |
|---------------|-----|-------|--------------|---------|-----------|---------------|-----------|---------------|--------------|
| Đoàn Nguyễn Minh | Đăng | dangdnm.ti.1720@gmail.com | 1115 | IT | Hành chính nhân sự | 0901234567 | male | full-time | 2024-01-15 |
| Phùng Khánh | Linh | pkl@gmail.com | 1116 | Sale | Văn phòng | 0907654321 | female | full-time | 2024-02-01 |
| Lê Văn | Cường | cuong.le@example.com | 1117 | Lập trình viên | IT | 0912345678 | male | full-time | 2024-03-10 |

## Lưu ý quan trọng:

1. **Tự động tạo phòng ban**: Nếu phòng ban chưa tồn tại trong hệ thống, hệ thống sẽ **tự động tạo mới** phòng ban đó
2. **Mã nhân viên (employee_id)** phải là duy nhất, không được trùng với nhân viên đã có
3. **Email** phải là email hợp lệ và duy nhất
4. Dòng đầu tiên (header) phải chứa tên các cột
5. Định dạng file: .xlsx hoặc .xls
6. Hệ thống sẽ tự động theo dõi các nhân viên đã import để tránh trùng lặp
6. Kích thước file tối đa: 10MB

## Các bước thực hiện:

1. Chuẩn bị file Excel theo format trên
2. Click vào button "Nhập nhân viên hàng loạt"
3. Kéo thả file Excel vào khu vực upload hoặc click để chọn file
4. Click "Bắt đầu thêm nhân viên hàng loạt"
5. Chờ hệ thống xử lý (có progress bar hiển thị tiến trình)
6. Xem kết quả import (số lượng thành công/thất bại)

## Xử lý lỗi:

Nếu có nhân viên nào import thất bại, hệ thống sẽ hiển thị chi tiết lỗi bao gồm:
- Số dòng bị lỗi
- Tên nhân viên (nếu có)
- Mô tả lỗi

Các lỗi thường gặp:
- Thiếu trường bắt buộc
- Phòng ban không tồn tại trong hệ thống
- Mã nhân viên hoặc email đã tồn tại
- Định dạng dữ liệu không hợp lệ
