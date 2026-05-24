# GIỚI THIỆU

## 1. Lý do chọn đề tài

Thương mại điện tử hiện nay đã trở thành một phần không thể thiếu trong đời sống hàng ngày, khi người tiêu dùng ngày càng ưa chuộng việc mua sắm trực tuyến thay vì đến cửa hàng trực tiếp. Nhu cầu đó thúc đẩy sự ra đời của hàng loạt nền tảng mua sắm với quy mô và tính năng ngày càng đa dạng, đòi hỏi những người làm kỹ thuật phải nắm vững cả về thiết kế hệ thống lẫn lập trình thực tế.

Trong quá trình học tập, nhóm nhận thấy rằng việc xây dựng một hệ thống thương mại điện tử thực sự là bài toán tổng hợp nhiều kỹ năng quan trọng: thiết kế cơ sở dữ liệu quan hệ, xây dựng REST API, xử lý luồng thanh toán, phân quyền người dùng, tối ưu hiệu suất với bộ nhớ đệm, và tích hợp các dịch vụ bên thứ ba. Đây là cơ hội lý tưởng để nhóm vận dụng kiến thức đã học vào một sản phẩm hoàn chỉnh, đồng thời tiếp cận và làm chủ các công nghệ đang được sử dụng phổ biến trong thực tế như Spring Boot, React, Redis và các hệ thống thanh toán trực tuyến.

Bên cạnh đó, điểm khác biệt mà nhóm muốn hướng đến là tích hợp thêm hệ thống gợi ý sản phẩm — một tính năng có mặt ở hầu hết các sàn thương mại điện tử lớn nhưng ít được đề cập trong các đồ án sinh viên thông thường. Điều này giúp đề tài có chiều sâu kỹ thuật hơn và tiệm cận hơn với yêu cầu của sản phẩm thực tế.

Từ những lý do trên, nhóm quyết định thực hiện đề tài **"Xây dựng hệ thống thương mại điện tử EcomX"** với mục tiêu xây dựng một ứng dụng web thương mại điện tử đầy đủ chức năng, áp dụng kiến trúc hiện đại và triển khai được trong môi trường thực tế.

---

## 2. Mục tiêu đề tài

Đề tài hướng đến xây dựng một hệ thống thương mại điện tử hoàn chỉnh với các mục tiêu cụ thể sau:

Về phía **người dùng**, hệ thống cho phép duyệt và tìm kiếm sản phẩm theo danh mục và thương hiệu, xem chi tiết sản phẩm với đầy đủ biến thể và giá, đặt hàng và thanh toán trực tuyến qua cổng VNPAY hoặc thanh toán khi nhận hàng (COD), theo dõi trạng thái đơn hàng, yêu cầu hoàn trả, và đánh giá sản phẩm sau khi nhận hàng. Hệ thống cũng gợi ý sản phẩm liên quan phù hợp với hành vi và lịch sử mua sắm của từng người dùng.

Về phía **quản trị viên**, hệ thống cung cấp đầy đủ công cụ để quản lý danh mục sản phẩm đa cấp, quản lý sản phẩm và biến thể theo mô hình SPU/SKU, quản lý đơn hàng và xử lý yêu cầu hoàn trả, quản lý tài khoản người dùng và phân quyền linh hoạt theo vai trò, cũng như cấu hình các chương trình khuyến mãi như giá theo số lượng và chương trình mua kèm.

Về **kỹ thuật**, mục tiêu là xây dựng hệ thống có kiến trúc rõ ràng, đảm bảo tính nhất quán dữ liệu trong các luồng quan trọng như thanh toán và đặt hàng, bảo mật xác thực bằng JWT với cơ chế xoay vòng refresh token, tối ưu hiệu suất bằng Redis cache, tích hợp tính phí vận chuyển theo khoảng cách địa lý thực tế và lưu trữ hình ảnh trên Cloudinary.

---

## 3. Đối tượng và phạm vi

**Đối tượng sử dụng** của hệ thống gồm ba nhóm chính: khách hàng mua sắm trực tuyến, nhân viên và quản trị viên quản lý hệ thống, và quản trị viên cấp cao với toàn quyền cấu hình hệ thống.

**Phạm vi chức năng** bao gồm toàn bộ vòng đời của một giao dịch mua sắm trực tuyến: từ duyệt sản phẩm, đặt hàng, thanh toán, quản lý đơn hàng, hoàn trả cho đến đánh giá sản phẩm. Hệ thống không bao gồm các tính năng như chat trực tiếp với người bán, quản lý kho hàng phức tạp theo lô và hạn sử dụng, hay ứng dụng di động (mobile app).

**Phạm vi công nghệ** được giới hạn trong ngăn xếp React + TypeScript cho frontend và Spring Boot + MySQL cho backend, triển khai dưới dạng ứng dụng web chạy trên môi trường máy tính cục bộ hoặc máy chủ Linux.

---

## 4. Bố cục báo cáo

Báo cáo được chia thành ba chương chính:

**Chương 1 — Khảo sát hiện trạng và xác lập dự án** phân tích thực trạng các hệ thống thương mại điện tử hiện có, xác định bài toán cần giải quyết, làm rõ các yêu cầu chức năng và phi chức năng của hệ thống EcomX, và trình bày các công nghệ được lựa chọn cùng lý do lựa chọn.

**Chương 2 — Phân tích và thiết kế hệ thống** trình bày các biểu đồ Use Case, Class Diagram, Sequence Diagram cho các luồng nghiệp vụ chính, thiết kế cơ sở dữ liệu, thiết kế hệ thống gợi ý sản phẩm và tổng quan kiến trúc toàn bộ hệ thống.

**Chương 3 — Xây dựng và triển khai hệ thống** mô tả chi tiết quá trình lập trình và tích hợp các thành phần: cài đặt cơ sở dữ liệu, xây dựng giao diện người dùng với React, xây dựng backend với Spring Boot, triển khai hệ thống gợi ý sản phẩm và tích hợp toàn bộ thành một hệ thống hoàn chỉnh.

Phần **Kết luận** tóm tắt những kết quả đạt được, những hạn chế còn tồn tại và hướng phát triển tiếp theo của hệ thống.
