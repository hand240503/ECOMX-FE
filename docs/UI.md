# UI.md — Chuẩn mực Giao diện Ecommerce (Tiki-style)

> File này là nền tảng chung cho toàn bộ giao diện. Mỗi trang sẽ có file riêng kế thừa và điều chỉnh từ đây.

---

## 1. Responsive Breakpoints

Hệ thống dùng **mobile-first**. Luôn viết style cho mobile trước, sau đó override lên tablet và desktop.

| Tên | Breakpoint | Thiết bị |
|-----|-----------|---------|
| `mobile` | `< 768px` | Điện thoại |
| `tablet` | `768px – 1023px` | iPad, tablet |
| `desktop` | `1024px – 1279px` | Laptop |
| `wide` | `≥ 1280px` | Màn hình lớn |

Nội dung chính được bao bởi container có `max-width: 1392px` (token `max-w-container`, đồng bộ với khối header/footer), căn giữa, padding ngang `16px` (mobile) / `24px` (tablet+).

---

## 2. Layout Tổng thể

Mọi trang đều gồm 3 phần cố định theo chiều dọc:

**Header** — cố định (sticky) trên cùng, không cuộn theo trang.

**Main Content** — phần thay đổi theo từng trang, chiếm toàn bộ không gian còn lại giữa header và footer.

**Footer** — ở cuối trang, không sticky.

### 2.1 Header

Header có 2 tầng:

**Tầng trên:** Logo (trái) — Thanh tìm kiếm (giữa, chiếm phần lớn width) — Nhóm icon (phải: giỏ hàng có badge số lượng, tài khoản, thông báo).

**Tầng dưới (desktop only):** Navigation bar chứa các danh mục cấp 1. Hover vào danh mục mở mega-dropdown hiện danh mục con + ảnh banner nhỏ.

Trên mobile: tầng dưới ẩn. Thay bằng icon hamburger ở tầng trên bên trái, mở drawer navigation từ trái sang.

Header nền trắng, có shadow nhẹ khi cuộn xuống. Chiều cao header desktop `~60px`, mobile `~56px`.

### 2.2 Footer

4 cột trên desktop, xếp chồng trên mobile. Gồm: thông tin công ty, chính sách mua hàng, hỗ trợ khách hàng, kênh mạng xã hội và app download. Dưới cùng là copyright bar.

### 2.3 Mobile Bottom Navigation

Chỉ hiện trên mobile. Bar cố định (fixed) ở đáy màn hình, gồm 5 tab: Trang chủ — Danh mục — Tìm kiếm — Giỏ hàng — Tài khoản. Tab active đổi màu xanh Tiki (`#1A94FF`).

---

## 3. Design Tokens

### Màu sắc

```
Primary:      #1A94FF   ← xanh Tiki, dùng cho CTA, link, badge active
Primary Dark: #0E6FCC   ← hover state của primary
Danger:       #FF4242   ← giá khuyến mãi, nút xóa, cảnh báo
Success:      #27AE60
Warning:      #F39C12
Text Primary: #27272A   ← tiêu đề, nội dung chính
Text Secondary:#6B6B6B  ← mô tả phụ, placeholder
Text Disabled:#BDBDBD
Border:       #E8E8E8
Background:   #F5F5FA   ← nền trang (xám nhạt như Tiki)
Surface:      #FFFFFF   ← nền card, modal, input
```

### Typography

```
Font: Inter (hoặc system-ui làm fallback)

Display:  24px / 700  ← tiêu đề trang
Heading:  20px / 700  ← tiêu đề section
Title:    16px / 600  ← tên sản phẩm, tiêu đề card
Body:     14px / 400  ← nội dung thông thường
Caption:  12px / 400  ← nhãn phụ, timestamp, badge text
```

### Spacing

Bội số 4px: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`.

### Border Radius

```
Button, Input, Badge: 4px
Card:                 8px
Modal, Drawer:        12px (top corners only cho bottom sheet)
Avatar, Circle badge: 50%
```

### Shadow

```
Card hover:   0 2px 8px rgba(0,0,0,0.10)
Dropdown:     0 4px 16px rgba(0,0,0,0.12)
Header:       0 1px 4px rgba(0,0,0,0.08)
```

---

## 4. Tailwind CSS — Quy tắc sử dụng

### 4.1 Cấu hình `tailwind.config.ts`

Toàn bộ design token ở Section 3 phải được khai báo vào `theme.extend` trong file config. Không được dùng giá trị màu hay spacing tùy tiện ngoài những gì đã mở rộng.

```ts
theme: {
  extend: {
    colors: {
      primary:     { DEFAULT: '#1A94FF', dark: '#0E6FCC' },
      danger:      '#FF4242',
      success:     '#27AE60',
      warning:     '#F39C12',
      text:        { primary: '#27272A', secondary: '#6B6B6B', disabled: '#BDBDBD' },
      border:      '#E8E8E8',
      background:  '#F5F5FA',
      surface:     '#FFFFFF',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      display: ['1.5rem',   { fontWeight: '700' }],
      heading: ['1.25rem',  { fontWeight: '700' }],
      title:   ['1rem',     { fontWeight: '600' }],
      body:    ['0.875rem', { fontWeight: '400' }],
      caption: ['0.75rem',  { fontWeight: '400' }],
    },
    borderRadius: {
      sm:   '4px',
      md:   '8px',
      lg:   '12px',
    },
    boxShadow: {
      card:     '0 2px 8px rgba(0,0,0,0.10)',
      dropdown: '0 4px 16px rgba(0,0,0,0.12)',
      header:   '0 1px 4px rgba(0,0,0,0.08)',
    },
    zIndex: {
      header:   '100',
      dropdown: '200',
      drawer:   '300',
      modal:    '400',
      toast:    '500',
    },
    maxWidth: {
      container: '1392px',
    },
    screens: {
      // mobile là default (< 768px), không cần prefix
      tablet:  '768px',
      desktop: '1024px',
      wide:    '1280px',
    },
  },
}
```

### 4.2 Cách viết class Tailwind

Luôn viết mobile-first: class không có prefix là cho mobile, thêm prefix `tablet:`, `desktop:`, `wide:` để override lên màn lớn hơn.

Ví dụ grid sản phẩm: `grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4`.

Ví dụ container chuẩn: `mx-auto max-w-container px-4 tablet:px-6`.

Ví dụ ẩn/hiện theo màn hình: `hidden desktop:block` (ẩn trên mobile, hiện từ desktop), `block desktop:hidden` (hiện trên mobile, ẩn từ desktop).

### 4.3 Màu sắc — chỉ dùng tên token

Dùng `text-primary` thay `text-[#1A94FF]`. Dùng `bg-background` thay `bg-[#F5F5FA]`. Dùng `border-border` thay `border-[#E8E8E8]`.

Trường hợp ngoại lệ dùng arbitrary value `[...]` chỉ được chấp nhận cho opacity hoặc giá trị không có trong token (ví dụ: `bg-black/40` cho overlay).

### 4.4 Không dùng `@apply` tùy tiện

`@apply` chỉ được dùng trong `globals.css` cho các pattern lặp lại toàn cục như `.btn-primary`, `.card`, `.input-base`. Không dùng `@apply` bên trong file component — viết class trực tiếp vào JSX.

### 4.5 Variant và trạng thái

Dùng Tailwind variant cho hover, focus, disabled, active:

`hover:bg-primary-dark`, `focus:ring-2 focus:ring-primary focus:outline-none`, `disabled:opacity-50 disabled:cursor-not-allowed`, `active:scale-95`.

Mọi button và link phải có `focus-visible:ring-2` để hỗ trợ keyboard navigation (accessibility).

### 4.6 Transition & Animation

Dùng `transition-all duration-200 ease-in-out` làm mặc định cho hover và state change.

Card sản phẩm hover: `transition-shadow duration-200 hover:shadow-card hover:-translate-y-0.5`.

Không dùng `transition-all` cho những element có transform phức tạp hoặc animation riêng — chỉ transition đúng property cần thiết.

### 4.7 Skeleton Loading

Skeleton dùng class `animate-pulse bg-border rounded-md`. Skeleton phải có width và height khớp với nội dung thật để không bị layout shift khi dữ liệu load xong.

### 4.8 Những điều KHÔNG làm với Tailwind

Không dùng inline style (`style={{}}`) cho những thứ Tailwind đã có class — dùng class Tailwind.

Không tạo class CSS thuần cho layout hoặc spacing — dùng Tailwind utilities.

Không dùng `text-[14px]` khi đã có `text-body` trong config.

Không để chuỗi class quá dài (hơn 8–10 class) trong một element mà không tách ra component.

---

## 5. Cấu trúc Component

### 5.1 Phân loại

**Atom** — đơn vị nhỏ nhất, không chứa logic nghiệp vụ: `Button`, `Input`, `Badge`, `Skeleton`, `Divider`, `Avatar`.

**Molecule** — ghép từ nhiều atom: `SearchBar`, `QuantityInput`, `RatingStars`, `PriceDisplay`, `Breadcrumb`.

**Organism** — block giao diện hoàn chỉnh, có thể chứa logic UI: `ProductCard`, `CartItem`, `OrderSummary`, `FilterSidebar`, `ReviewItem`.

**Template** — khung layout của một trang (Header + Main layout + Footer), không chứa dữ liệu thật.

**Page** — gắn dữ liệu thật từ hooks vào Template, xử lý routing và loading/error/empty.

### 5.2 Quy tắc viết component

Một component chỉ làm một việc. Nếu component cần gọi API hoặc đọc store, đó phải là Page hoặc một Container hook riêng — không phải Organism.

Organism nhận dữ liệu qua props, không tự fetch. Page truyền dữ liệu từ hook xuống Organism.

Mọi component nhận dữ liệu bất đồng bộ phải xử lý đủ 3 trạng thái: loading (dùng Skeleton), error (hiện thông báo + nút thử lại), empty (hiện EmptyState).

---

## 6. Dữ liệu từ API ra UI

### 6.1 Luồng một chiều

```
Page gọi hook → hook gọi service → service gọi API → API trả raw data
→ service transform thành domain type → hook trả về domain type → Page truyền xuống component
```

Nguyên tắc: component không bao giờ biết raw API type là gì. Component chỉ nhận domain type đã được transform.

### 6.2 Domain types UI dùng

Tất cả giá tiền là số nguyên đơn vị VNĐ. Format ra `"1.290.000₫"` tại tầng UI bằng hàm `formatPrice(amount: number): string`.

Tất cả ngày giờ là `Date` object. Format ra chuỗi hiển thị bằng `formatDate(date: Date): string`.

`discountPercent` được tính sẵn trong service, UI chỉ việc render — không tự tính lại.

`inStock: boolean` được tính sẵn từ `inventory_quantity`, UI không so sánh số.

### 6.3 Trạng thái dữ liệu

Mọi data fetch phải phản ánh đủ 4 trạng thái:

**idle** — chưa fetch (hiếm, thường chỉ xảy ra trước lần mount đầu).

**loading** — đang fetch lần đầu → render Skeleton tương ứng kích thước nội dung thật.

**error** — fetch thất bại → hiện thông báo lỗi `userMessage` từ API + nút "Thử lại".

**success** — có dữ liệu → render nội dung. Nếu mảng rỗng → render EmptyState.

Khi refetch (đã có dữ liệu cũ, đang tải mới): giữ nội dung cũ, hiện loading indicator nhỏ (spinner góc trên hoặc progress bar). Không thay toàn bộ bằng Skeleton.

### 6.4 Optimistic Update

Cart và wishlist dùng optimistic update: cập nhật UI ngay lập tức, rollback nếu API thất bại. Người dùng không chờ response mới thấy thay đổi.

---

## 7. Gọi API từ UI

### 7.1 Nguyên tắc

Không import API endpoint trực tiếp trong component hoặc page. Luôn đi qua hook.

Không đặt `fetch` hay `axios` trong component. Đó là việc của service layer.

Page chỉ gọi: `const { data, isLoading, error } = useXxx(params)`.

### 7.2 Server State — React Query

Dùng cho: danh sách sản phẩm, chi tiết sản phẩm, danh mục, đơn hàng, profile.

Đây là dữ liệu đến từ server, có thể stale, cần cache và invalidate. React Query quản lý vòng đời này.

Query key phải bao gồm tất cả params ảnh hưởng đến kết quả. Ví dụ: list sản phẩm với filter → key chứa toàn bộ object filter.

Stale time mặc định 5 phút. Không refetch on window focus.

### 7.3 Global Client State — Zustand

Dùng cho: giỏ hàng (số lượng, items), trạng thái đăng nhập, modal/drawer mở đóng, toast notifications.

Cart store persist xuống localStorage. Auth store persist user info (không persist token — token lưu sessionStorage).

### 7.4 URL State

Bộ lọc sản phẩm (category, price range, sort, page, search keyword) sống trong URL searchParams. Lý do: user có thể copy URL và gửi cho người khác, back button hoạt động đúng.

Khi filter thay đổi: update URL thay vì setState. Component đọc filter từ URL.

### 7.5 Local State

Dropdown mở/đóng, tab đang active, giá trị input form chưa submit — dùng `useState` trong component. Không đưa lên store.

---

## 8. Tương tác & Feedback

**Loading:** Skeleton cho lần tải đầu. Spinner nhỏ cho action (thêm vào giỏ, đặt hàng). Progress bar mỏng ở top cho page transition.

**Toast notification:** Xuất hiện góc trên bên phải (desktop) hoặc trên cùng giữa (mobile). Tự động biến mất sau 4 giây. Có nút X để đóng sớm. Success màu xanh lá, error màu đỏ, info màu xanh dương.

**Button loading state:** Khi đang xử lý, button disable và hiện spinner thay text. Không cho submit 2 lần.

**Form validation:** Validate realtime sau khi user rời khỏi field (onBlur). Hiện lỗi dưới field màu đỏ. Không validate khi user đang gõ giữa chừng.

**Hover state:** Card sản phẩm có shadow và translate lên nhẹ (`transform: translateY(-2px)`). Button darkens 10%.

**Empty state:** Có icon minh họa, tiêu đề rõ ràng, mô tả gợi ý hành động tiếp theo, và nút CTA. Không chỉ hiện chữ "Không có dữ liệu".

---

## 9. Grid & Layout Sản phẩm

Danh sách sản phẩm dùng CSS Grid responsive:

- Mobile: 2 cột
- Tablet: 3 cột  
- Desktop: 4 cột
- Wide: 4–5 cột

Khoảng cách giữa các card: `12px` (mobile) / `16px` (desktop).

ProductCard tỉ lệ ảnh `1:1` (square). Ảnh dùng `object-fit: cover`. Không bao giờ stretch ảnh.

Trang danh mục có layout 2 vùng: sidebar filter bên trái (width `240px`, fixed) và grid sản phẩm bên phải. Trên mobile, sidebar ẩn, thay bằng nút "Lọc" mở bottom sheet.

---

## 10. Hiệu năng UI

Ảnh sản phẩm dùng lazy loading (`loading="lazy"`). Ảnh hero dùng `loading="eager"`.

ProductCard không render ảnh hover variant cho đến khi user hover (load on demand).

Danh sách dài dùng pagination — không dùng infinite scroll cho trang danh mục chính (để URL shareable). Chỉ dùng infinite scroll trong các widget "Sản phẩm gợi ý" ở trang chi tiết.

Debounce 300ms cho search input. Debounce 500ms cho filter price range slider.

---

## 11. Màu sắc theo trạng thái sản phẩm

Giá gốc (bị gạch): `Text Secondary (#6B6B6B)`, `text-decoration: line-through`, font-size nhỏ hơn giá khuyến mãi.

Giá khuyến mãi / giá hiện tại: `Danger (#FF4242)`, font-weight 600.

Badge "Giảm X%": nền `Danger`, chữ trắng, border-radius 4px.

Badge "Hết hàng": nền `#E0E0E0`, chữ `Text Secondary`.

Badge "Sắp hết": nền `#FFF3CD`, chữ `Warning`.

Sản phẩm hết hàng: ảnh giảm opacity 50%, overlay nhẹ, nút "Thêm vào giỏ" disabled.

---

## 12. Điều hướng & Routing

Dùng Next.js App Router. Mọi route được pre-render ở server (SSR hoặc SSG) nếu có thể.

Trang chi tiết sản phẩm: SSG với revalidate (ISR). Dữ liệu cơ bản render trên server, review và dữ liệu real-time fetch trên client.

Trang danh sách sản phẩm có filter: SSR theo searchParams.

Trang giỏ hàng, checkout, tài khoản: render client-side, có route guard kiểm tra auth.

Route guard: nếu user chưa đăng nhập và truy cập `/account/*` hoặc `/checkout` → redirect về `/auth/login?redirect=<url_hiện_tại>`. Sau khi đăng nhập → redirect về URL ban đầu.

---

## 13. Những điều KHÔNG làm

Không hardcode màu sắc trực tiếp vào component — luôn dùng token đã khai báo trong `tailwind.config.ts`.

Không để component tự fetch dữ liệu bằng axios/fetch trực tiếp.

Không hiện raw error message từ server ra UI — luôn dùng `userMessage`.

Không dùng `px` cố định cho font-size — dùng class `text-body`, `text-caption`... từ config Tailwind.

Không tạo thêm global state cho dữ liệu đã có trong React Query cache.

Không bỏ qua loading và error state với lý do "sẽ làm sau".

Không dùng `!important` trong CSS.

Không đặt `z-index` tùy tiện — dùng class `z-header`, `z-dropdown`, `z-drawer`, `z-modal`, `z-toast` đã khai báo trong config.

Không dùng inline style (`style={{}}`) cho layout, spacing, màu sắc — ưu tiên Tailwind class.

Không dùng `@apply` trong file component — chỉ dùng trong `globals.css` cho pattern toàn cục.
