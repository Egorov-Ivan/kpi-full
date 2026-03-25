const loadBufferData = async (year?: number, month?: number) => {
  loading.value = true;
  error.value = null;
  
  try {
    // Если переданы год и месяц — используем API
    if (year && month) {
      const dateStart = `01-${String(month).padStart(2, '0')}-${year}`;
      const lastDay = new Date(year, month, 0).getDate();
      const dateEnd = `${String(lastDay).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
      
      console.log(`📡 Запрос к API: ${dateStart} - ${dateEnd}`);
      
      const response = await fetch('/api/buffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateStart, dateEnd })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.operations && Array.isArray(data.operations)) {
        bufferData.value = data.operations;
        console.log(`✅ Буфер загружен из API: ${bufferData.value.length} записей`);
        return bufferData.value;
      }
    }
    
    // Fallback: загрузка из JSON
    console.log('🔄 Загрузка /data/buffer.json...');
    const response = await fetch('/data/buffer.json');
    const data = await response.json();
    
    if (Array.isArray(data)) {
      bufferData.value = data;
    } else if (data.operations) {
      bufferData.value = data.operations;
    } else {
      bufferData.value = [];
    }
    
    console.log(`✅ Буфер загружен из JSON: ${bufferData.value.length} записей`);
    return bufferData.value;
    
  } catch (error) {
    console.error('❌ Ошибка загрузки буфера:', error);
    bufferData.value = [];
    return [];
  } finally {
    loading.value = false;
  }
};