const Sidebar = () => {
  const categories = [
    { name: 'Điện thoại - Tablet', icon: '📱' },
    { name: 'Laptop - Ultrabook', icon: '💻' },
    { name: 'PC - Linh kiện', icon: '🧩' },
    { name: 'Màn hình - Máy in', icon: '🖥️' },
    { name: 'Thiết bị âm thanh', icon: '🎧' },
    { name: 'Gaming gear', icon: '🎮' },
    { name: 'Camera - An ninh', icon: '📷' },
    { name: 'Thiết bị mạng', icon: '📶' },
    { name: 'Phụ kiện công nghệ', icon: '🔌' },
    { name: 'Điện gia dụng thông minh', icon: '🏠' },
    { name: 'Đồng hồ thông minh', icon: '⌚' },
    { name: 'Apple chính hãng', icon: '🍎' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <h3 className="font-bold text-gray-800 mb-3 px-2">Danh muc</h3>
      <ul className="flex flex-col gap-1">
        {categories.map((cat, index) => (
          <li key={index}>
            <a href="#" className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-md text-sm text-gray-700 transition-colors">
              <span className="text-base" aria-hidden>
                {cat.icon}
              </span>
              <span className="truncate">{cat.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
