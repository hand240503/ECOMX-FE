const ANNOUNCEMENTS = [
  '🧾 Xuất VAT đầy đủ',
  '🚚 Giao nhanh – Miễn phí cho đơn 300k',
  '♻️ Thu cũ giá ngon – Lên đời tiết kiệm',
  '✅ Sản phẩm Chính hãng',
  '🏪 Cửa hàng gần bạn',
  '📋 Tra cứu đơn hàng',
  '📞 1800 2097',
];

const TopAnnouncementBar = () => {
  return (
    <div className="overflow-hidden bg-red-600 py-1.5 text-white">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((text, i) => (
          <span key={i} className="mx-8 text-xs font-medium">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TopAnnouncementBar;
