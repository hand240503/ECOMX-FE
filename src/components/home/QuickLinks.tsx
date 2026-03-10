interface QuickLinkItem {
  id: number;
  title: string;
  icon: string;
}

const QuickLinks = () => {
  const items: QuickLinkItem[] = [
    { id: 1, title: 'Deal Điện Thoại', icon: '📱' },
    { id: 2, title: 'Laptop Văn Phòng', icon: '💻' },
    { id: 3, title: 'Gaming Gear', icon: '🎮' },
    { id: 3, title: 'Thiết bị mạng', icon: '📶' },
    { id: 4, title: 'Apple Zone', icon: '🍎' },
    { id: 5, title: 'Màn hình 144Hz', icon: '🖥️' },
    { id: 6, title: 'Tai nghe - Loa', icon: '🎧' },
    { id: 7, title: 'Camera an ninh', icon: '📷' },
    { id: 8, title: 'Đồng hồ thông minh', icon: '⌚' },
    { id: 9, title: 'Phụ kiện giá tốt', icon: '🔌' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex justify-between md:justify-start md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-center min-w-[80px] cursor-pointer group">
            <div className="w-12 h-12 rounded-xl mb-2 flex items-center justify-center transition-transform group-hover:-translate-y-1 bg-blue-50">
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
            </div>
            <span className="text-xs text-center text-gray-700 line-clamp-2 max-w-[90px] font-medium leading-tight">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
