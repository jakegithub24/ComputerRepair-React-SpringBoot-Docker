-- Sample Product Catalog Data for E-Commerce Platform
-- Categories: Laptop, Desktop, RAM, SSD, HDD, Router, Pendrive, Monitor, Keyboard, Mouse, Printer, GPU, CPU, Motherboard, Power Supply, Cooling

-- Laptops
INSERT OR IGNORE INTO catalogue_items (product_id, name, category, description, price, stock, brand, model, specs, available, created_at, updated_at) VALUES
('PROD-0001', 'Dell XPS 13', 'Laptop', 'Ultraportable laptop with Intel i7, 16GB RAM, 512GB SSD', 1299.99, 5, 'Dell', 'XPS 13', '{"processor":"Intel Core i7-1280P","ram":"16GB DDR5","storage":"512GB SSD","display":"13.4\" FHD","weight":"2.8 lbs"}', 1, datetime('now'), datetime('now')),
('PROD-0002', 'MacBook Pro 14', 'Laptop', 'Apple M3 Max chip with 18GB unified memory', 1999.99, 3, 'Apple', 'MacBook Pro 14', '{"processor":"Apple M3 Max","ram":"18GB","storage":"512GB SSD","display":"14.2\" Liquid Retina XDR","weight":"3.5 lbs"}', 1, datetime('now'), datetime('now')),
('PROD-0003', 'Lenovo ThinkPad X1', 'Laptop', 'Business laptop with Intel i5, 8GB RAM, 256GB SSD', 899.99, 8, 'Lenovo', 'ThinkPad X1', '{"processor":"Intel Core i5-1240P","ram":"8GB DDR4","storage":"256GB SSD","display":"14\" FHD","weight":"3.0 lbs"}', 1, datetime('now'), datetime('now')),
('PROD-0004', 'ASUS ROG Gaming', 'Laptop', 'Gaming laptop with RTX4060, Intel i7, 16GB RAM', 1499.99, 4, 'ASUS', 'ROG Strix G16', '{"processor":"Intel Core i7-13700H","gpu":"NVIDIA RTX 4060","ram":"16GB DDR5","storage":"512GB SSD","display":"16\" QHD 165Hz","weight":"5.5 lbs"}', 1, datetime('now'), datetime('now')),
('PROD-0005', 'HP Pavilion 15', 'Laptop', 'Budget-friendly laptop with Ryzen 5, 8GB RAM', 599.99, 12, 'HP', 'Pavilion 15', '{"processor":"AMD Ryzen 5 5500","ram":"8GB DDR4","storage":"256GB SSD","display":"15.6\" FHD","weight":"4.7 lbs"}', 1, datetime('now'), datetime('now')),

-- Desktops
('PROD-0006', 'iMac 24" M3', 'Desktop', 'All-in-one desktop with M3 chip, 8GB RAM', 1299.99, 2, 'Apple', 'iMac 24', '{"processor":"Apple M3","ram":"8GB","storage":"256GB SSD","display":"24\" 4.5K Retina","gpu":"Integrated"}', 1, datetime('now'), datetime('now')),
('PROD-0007', 'Dell XPS Desktop', 'Desktop', 'Compact desktop with RTX4070, Intel i9', 2199.99, 1, 'Dell', 'XPS Desktop', '{"processor":"Intel Core i9-13900K","gpu":"NVIDIA RTX 4070","ram":"32GB DDR5","storage":"1TB SSD","power":"750W"}', 1, datetime('now'), datetime('now')),
('PROD-0008', 'HP Elite Small Form', 'Desktop', 'Small form factor PC for office and productivity', 749.99, 6, 'HP', 'Elite SFF', '{"processor":"Intel Core i5-12400","ram":"8GB DDR4","storage":"512GB SSD","form":"Small Form Factor"}', 1, datetime('now'), datetime('now')),

-- RAM Memory
('PROD-0009', 'Corsair Vengeance 16GB DDR5', 'RAM', 'High-speed DDR5 memory, 5600MHz', 89.99, 20, 'Corsair', 'Vengeance DDR5', '{"capacity":"16GB","speed":"5600MHz","type":"DDR5","voltage":"1.25V"}', 1, datetime('now'), datetime('now')),
('PROD-0010', 'Kingston HyperX 32GB DDR4', 'RAM', 'DDR4 High Performance, 3200MHz', 119.99, 15, 'Kingston', 'HyperX Fury', '{"capacity":"32GB (2x16GB)","speed":"3200MHz","type":"DDR4","voltage":"1.35V"}', 1, datetime('now'), datetime('now')),
('PROD-0011', 'SK Hynix 8GB DDR5', 'RAM', 'Budget DDR5 memory, 4800MHz', 49.99, 25, 'SK Hynix', 'DDR5', '{"capacity":"8GB","speed":"4800MHz","type":"DDR5","voltage":"1.1V"}', 1, datetime('now'), datetime('now')),

-- SSD Storage
('PROD-0012', 'Samsung 990 Pro 2TB', 'SSD', 'High-speed NVMe SSD for gaming and content creation', 229.99, 10, 'Samsung', '990 Pro', '{"capacity":"2TB","interface":"NVMe M.2","speed":"7100MB/s","form":"M.2 2280"}', 1, datetime('now'), datetime('now')),
('PROD-0013', 'WD Blue SN580 1TB', 'SSD', 'Fast SSD for general computing tasks', 99.99, 18, 'Western Digital', 'Blue SN580', '{"capacity":"1TB","interface":"NVMe M.2","speed":"4200MB/s","form":"M.2 2280"}', 1, datetime('now'), datetime('now')),
('PROD-0014', 'Crucial P5 Plus 1TB', 'SSD', 'Mid-range NVMe SSD with good performance', 129.99, 12, 'Crucial', 'P5 Plus', '{"capacity":"1TB","interface":"NVMe M.2","speed":"5100MB/s","form":"M.2 2280"}', 1, datetime('now'), datetime('now')),
('PROD-0015', 'Kingston A2000 500GB', 'SSD', 'Budget NVMe SSD for upgrades', 49.99, 20, 'Kingston', 'A2000', '{"capacity":"500GB","interface":"NVMe M.2","speed":"3200MB/s","form":"M.2 2280"}', 1, datetime('now'), datetime('now')),

-- HDD Storage
('PROD-0016', 'Seagate Barracuda 4TB', 'HDD', 'Desktop hard drive for storage expansion', 79.99, 10, 'Seagate', 'Barracuda', '{"capacity":"4TB","speed":"5400 RPM","interface":"SATA","form":"3.5 inch"}', 1, datetime('now'), datetime('now')),
('PROD-0017', 'WD Red Pro 8TB', 'HDD', 'NAS-optimized hard drive', 189.99, 5, 'Western Digital', 'Red Pro', '{"capacity":"8TB","speed":"7200 RPM","interface":"SATA","form":"3.5 inch"}', 1, datetime('now'), datetime('now')),

-- Network & Connectivity
('PROD-0018', 'TP-Link WiFi 6 Router', 'Router', 'Dual-band WiFi 6 router with mesh support', 149.99, 8, 'TP-Link', 'AXE500', '{"standard":"WiFi 6 (802.11ax)","bands":"Dual-band","speed":"AX5400","ports":"4x Gigabit"}', 1, datetime('now'), datetime('now')),
('PROD-0019', 'Netgear Nighthawk', 'Router', 'Gaming WiFi 6E router for ultra-fast speeds', 249.99, 4, 'Netgear', 'Nighthawk RAXE500', '{"standard":"WiFi 6E","bands":"Tri-band","speed":"AXE7300","ports":"4x Gigabit"}', 1, datetime('now'), datetime('now')),

-- USB & Storage Devices
('PROD-0020', 'SanDisk Ultra USB 256GB', 'Pendrive', 'Fast USB 3.1 flash drive for file transfer', 29.99, 30, 'SanDisk', 'Ultra', '{"capacity":"256GB","interface":"USB 3.1","speed":"150MB/s"}', 1, datetime('now'), datetime('now')),
('PROD-0021', 'Kingston DataTraveler 128GB', 'Pendrive', 'Compact USB 3.2 flash drive', 19.99, 40, 'Kingston', 'DataTraveler', '{"capacity":"128GB","interface":"USB 3.2","speed":"100MB/s"}', 1, datetime('now'), datetime('now')),
('PROD-0022', 'Seagate Backup Plus 4TB', 'Pendrive', 'External portable hard drive for backup', 89.99, 6, 'Seagate', 'Backup Plus', '{"capacity":"4TB","interface":"USB 3.0","speed":"120MB/s","form":"Portable"}', 1, datetime('now'), datetime('now')),

-- Monitors
('PROD-0023', 'Dell S2721DGF 27"', 'Monitor', '1440p gaming monitor with 165Hz refresh rate', 399.99, 4, 'Dell', 'S2721DGF', '{"size":"27 inch","resolution":"2560x1440","refreshRate":"165Hz","response":"1ms","panel":"IPS"}', 1, datetime('now'), datetime('now')),
('PROD-0024', 'LG 27UP550 4K', 'Monitor', '4K IPS monitor for professional work', 499.99, 3, 'LG', '27UP550', '{"size":"27 inch","resolution":"3840x2160","refreshRate":"60Hz","response":"5ms","panel":"IPS"}', 1, datetime('now'), datetime('now')),
('PROD-0025', 'ASUS ProArt 24"', 'Monitor', 'Color-accurate monitor for content creators', 349.99, 2, 'ASUS', 'PA247CV', '{"size":"24 inch","resolution":"1920x1200","refreshRate":"60Hz","colorAccuracy":"99% sRGB","panel":"IPS"}', 1, datetime('now'), datetime('now')),

-- Input Devices
('PROD-0026', 'Logitech MX Keys', 'Keyboard', 'Premium wireless mechanical keyboard', 99.99, 12, 'Logitech', 'MX Keys', '{"type":"Mechanical","connection":"Wireless (2.4GHz)","layout":"Full-size","backlighting":"Yes"}', 1, datetime('now'), datetime('now')),
('PROD-0027', 'Keychron K2', 'Keyboard', 'Compact mechanical keyboard with hot-swap switches', 69.99, 15, 'Keychron', 'K2', '{"type":"Mechanical","connection":"Wireless","layout":"75%","switches":"Gateron"}', 1, datetime('now'), datetime('now')),
('PROD-0028', 'Razer DeathAdder V3', 'Mouse', 'Gaming mouse with 30K DPI sensor', 69.99, 18, 'Razer', 'DeathAdder V3', '{"type":"Gaming","dpi":"30000","refreshRate":"8000Hz","connection":"Wired","weight":"63g"}', 1, datetime('now'), datetime('now')),
('PROD-0029', 'Logitech MX Master 3S', 'Mouse', 'Productivity mouse for professionals', 99.99, 10, 'Logitech', 'MX Master 3S', '{"type":"Productivity","buttons":"Multi-device","connection":"Wireless","scrolling":"MagSpeed"}', 1, datetime('now'), datetime('now')),

-- Peripherals & Accessories
('PROD-0030', 'Brother HL-L8360CDW', 'Printer', 'Color laser printer for office use', 449.99, 2, 'Brother', 'HL-L8360CDW', '{"type":"Color Laser","printSpeed":"33ppm","resolution":"600x600 dpi","connectivity":"Wireless"}', 1, datetime('now'), datetime('now')),

-- Graphics & Processing
('PROD-0031', 'NVIDIA RTX 4070 Ti', 'GPU', 'High-end graphics card for gaming and AI', 699.99, 3, 'NVIDIA', 'RTX 4070 Ti', '{"memory":"12GB GDDR6X","interface":"PCIe 4.0","power":"285W","architecture":"Ada"}', 1, datetime('now'), datetime('now')),
('PROD-0032', 'AMD Radeon RX 7700 XT', 'GPU', 'Mid-range gaming GPU with 12GB VRAM', 349.99, 5, 'AMD', 'RX 7700 XT', '{"memory":"12GB GDDR6","interface":"PCIe 4.0","power":"250W","architecture":"RDNA 3"}', 1, datetime('now'), datetime('now')),
('PROD-0033', 'Intel Core i9-13900KS', 'CPU', 'High-performance desktop processor', 689.99, 2, 'Intel', 'i9-13900KS', '{"cores":"24","threads":"32","baseFreq":"3.4 GHz","turboFreq":"6.2 GHz","socket":"LGA1700"}', 1, datetime('now'), datetime('now')),
('PROD-0034', 'AMD Ryzen 9 7950X', 'CPU', 'High-core-count processor for workstations', 549.99, 3, 'AMD', 'Ryzen 9 7950X', '{"cores":"16","threads":"32","baseFreq":"4.5 GHz","turboFreq":"5.7 GHz","socket":"AM5"}', 1, datetime('now'), datetime('now')),

-- Motherboards
('PROD-0035', 'ASUS ROG STRIX Z790-E', 'Motherboard', 'Premium Intel Z790 motherboard for gaming', 349.99, 4, 'ASUS', 'ROG STRIX Z790-E', '{"socket":"LGA1700","chipset":"Z790","formFactor":"ATX","features":"PCIe 5.0, Thunderbolt"}', 1, datetime('now'), datetime('now')),
('PROD-0036', 'MSI MPG B850 Edge WiFi', 'Motherboard', 'Mid-range AMD AM5 motherboard with WiFi', 179.99, 6, 'MSI', 'MPG B850 Edge', '{"socket":"AM5","chipset":"B850","formFactor":"ATX","features":"WiFi 6E, PCIe 5.0"}', 1, datetime('now'), datetime('now')),

-- Power & Cooling
('PROD-0037', 'Corsair RM850x', 'Power Supply', '850W 80+ Gold modular power supply', 119.99, 8, 'Corsair', 'RM850x', '{"wattage":"850W","efficiency":"80+ Gold","certification":"80+ Gold","connector":"24-pin","modular":"Yes"}', 1, datetime('now'), datetime('now')),
('PROD-0038', 'Noctua NH-D15', 'Cooling', 'Top-flow air cooler for high-end CPUs', 89.99, 10, 'Noctua', 'NH-D15', '{"type":"Air","socket":"Intel/AMD","tdp":"250W","fans":"2x 140mm","height":"160mm"}', 1, datetime('now'), datetime('now')),
('PROD-0039', 'NZXT Kraken X73', 'Cooling', 'All-in-one liquid cooler 360mm', 179.99, 5, 'NZXT', 'Kraken X73', '{"type":"Liquid AIO","radiator":"360mm","fans":"3x 120mm","pump":"7th Gen","cap":"60 dB"}', 1, datetime('now'), datetime('now')),

-- Miscellaneous
('PROD-0040', 'Cable Matters 8K HDMI', 'Accessory', 'Premium HDMI 2.1 cable for 8K video', 19.99, 30, 'Cable Matters', 'HDMI 2.1', '{"type":"HDMI 2.1","length":"3 feet","max_bandwidth":"48 Gbps","rating":"8K@60Hz"}', 1, datetime('now'), datetime('now')),
('PROD-0041', 'Anker USB-C Hub 7-in-1', 'Accessory', 'Multiport USB-C hub with multiple connections', 39.99, 16, 'Anker', 'USB-C Hub', '{"ports":"7 in 1","includes":"USB 3.0, HDMI, SD Card, USB-C PD"}', 1, datetime('now'), datetime('now')),
('PROD-0042', 'APC Back-UPS 1000VA', 'Accessory', 'Uninterruptible power supply for protection', 149.99, 4, 'APC', 'Back-UPS 1000', '{"capacity":"1000 VA / 600W","outlets":"12","battery_backup":"8 outlets"}', 1, datetime('now'), datetime('now'));
