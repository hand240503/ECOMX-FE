# API Tài Liệu: Danh sách Sản phẩm Khuyến Mãi (Active Promotions)

Tài liệu này mô tả chi tiết về API dùng để lấy danh sách các sản phẩm đang chạy chương trình khuyến mãi (đang có hiệu lực), được phân loại theo từng nhóm chương trình khuyến mãi tương ứng.

---

## Thông tin API

- **Endpoint**: `GET /products/active-promotions`
  *(Lưu ý: Thêm prefix của API theo cấu hình chung, ví dụ `/api/v1/products/active-promotions`)*
- **Phương thức**: `GET`
- **Quyền truy cập**: Public (Không yêu cầu xác thực - Token)

---

## Mô tả chức năng

API này sẽ gom nhóm và trả về tất cả các sản phẩm đang tham gia vào các chương trình khuyến mãi đang ở trạng thái **active** (bật/hiệu lực) ở thời điểm hiện tại. Danh sách sản phẩm được chia thành 3 mảng chính theo 3 loại chương trình:

1. **Price Change (Thay đổi giá)**: Chứa các sản phẩm đang có lịch thay đổi giá tạm thời (ví dụ: Flash Sale) đang có hiệu lực.
2. **Volume Tier (Giá theo bậc số lượng)**: Chứa các sản phẩm được thiết lập mua số lượng nhiều để giảm giá (Mix-and-match / Mua sỉ).
3. **Purchase With Purchase (Mua kèm ưu đãi)**: Chứa cả sản phẩm chính (Anchor) và sản phẩm mua kèm (Companion) trong các gói khuyến mãi PWP đang được bật.

---

## Định dạng Dữ liệu Trả về (Response Format)

API sẽ trả về theo định dạng chuẩn của hệ thống (`APIResponse`), bao gồm `success`, `message` và payload chính nằm ở trường `data`.

### Cấu trúc JSON Response:

```json
{
  "success": true,
  "message": "Active promotions retrieved successfully",
  "data": {
    "price_change": [
      // Danh sách ProductFullResponse
    ],
    "volume_tier": [
      // Danh sách ProductFullResponse
    ],
    "purchase_with_purchase": [
      // Danh sách ProductFullResponse
    ]
  },
  "errors": null,
  "metadata": null
}
```

### Chi tiết các trường trong `data`:

| Tên trường (Field) | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `price_change` | `Array<ProductFullResponse>` | Mảng chứa toàn bộ các sản phẩm đang có giá ưu đãi theo thời gian (giá thay đổi do Event/Sale). Dữ liệu này chỉ chứa các sản phẩm có khoảng thời gian `startAt` <= hiện tại và (`endAt` >= hiện tại hoặc `endAt` is null). |
| `volume_tier` | `Array<ProductFullResponse>` | Mảng chứa toàn bộ các sản phẩm hỗ trợ bậc giá theo số lượng. (Người mua thêm SL để được giảm đơn giá). |
| `purchase_with_purchase` | `Array<ProductFullResponse>` | Mảng chứa toàn bộ các sản phẩm tham gia Mua kèm Ưu đãi (PWP). Lưu ý: Danh sách này trả về cả sản phẩm Neo (Anchor) và sản phẩm đính kèm (Companion) đã loại bỏ trùng lặp. |

*(Chú ý: Mỗi phần tử trong mảng là cấu trúc chi tiết của 1 Sản phẩm - `ProductFullResponse`, chứa đầy đủ ảnh, biến thể, giá bán lẻ, rating, v.v. giống hệt như API danh sách sản phẩm thông thường).*

---

## Ứng dụng ở phía Frontend (UI)

Dữ liệu trả về từ API này rất phù hợp để xây dựng các Section/Block hiển thị trên trang chủ (Home Page) hoặc trang Ưu đãi (Promotions Page):

1. **Section "Flash Sale" / "Giá sốc hôm nay"**: 
   - Render từ mảng `data.price_change`.
   - Có thể thiết kế giao diện kèm nhãn dán (badge) "Giảm giá" hoặc "Flash Sale".

2. **Section "Mua nhiều giảm sâu" / "Giá sỉ"**: 
   - Render từ mảng `data.volume_tier`.
   - Có thể làm banner thu hút khách hàng Mua sỉ / Tích lũy.

3. **Section "Mua kèm Siêu Rẻ" / "Ưu đãi Combo"**: 
   - Render từ mảng `data.purchase_with_purchase`.
   - Phù hợp để làm tính năng gợi ý mua sắm thông minh (Smart Shopping).

## Xử lý Lỗi (Error Handling)

- Quá trình xử lý nội bộ nếu xảy ra lỗi hệ thống (rất hiếm khi xảy ra), API sẽ trả về HTTP Status `400` hoặc `500`, với `success: false` và kèm theo danh sách `errors`. Front-end nên bắt lỗi và xử lý empty state (không hiển thị các section khuyến mãi hoặc hiển thị thông báo "Đang tải dữ liệu ưu đãi...").
