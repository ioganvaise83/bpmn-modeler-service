import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import './style.css';

import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/newDiagram.bpmn';

const container = $('#js-drop-zone');

let modeler = null;

// Инициализация modeler
async function initializeModeler() {
  try {
    const canvasElement = document.querySelector('#js-canvas');
    if (!canvasElement) {
      throw new Error('Элемент canvas не найден');
    }

    modeler = new BpmnModeler({
      container: canvasElement,
    });

    // Ждем пока modeler будет готов
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('✅ Моделировщик BPMN инициализирован');
    return modeler;
  } catch (err) {
    console.error('❌ Ошибка инициализации моделировщика:', err);
    throw err;
  }
}

// --- Основные функции ---

async function openDiagram(xml) {
  try {
    // Проверяем, что modeler инициализирован
    if (!modeler) {
      await initializeModeler();
    }

    await modeler.importXML(xml);
    container.removeClass('with-error').addClass('with-diagram');
    document.querySelector('#save-button').disabled = false;
  } catch (err) {
    container.removeClass('with-diagram').addClass('with-error');
    container.find('.error pre').text(err.message);
    console.error('Ошибка при импорте схемы:', err);
  }
}

async function saveDiagram() {
  try {
    console.log('🔍 Начало сохранения диаграммы...');
    //console.log('🔍 Modeler доступен:', !!modeler);
    
    // Проверяем, что modeler инициализирован
    if (!modeler) {
      throw new Error('Моделировщик BPMN не инициализирован');
    }

    // Сохраняем XML из моделировщика
    console.log('📄 Вызов modeler.saveXML...');
    const result = await modeler.saveXML({ format: true });
    console.log('📄 Результат saveXML:', result);
    console.log('📄 Тип результата:', typeof result);
    console.log('📄 Ключи результата:', result ? Object.keys(result) : 'result is falsy');
    
    // Детальная проверка результата
    if (!result) {
      throw new Error('Моделировщик не вернул данные - результат undefined');
    }
    
    if (typeof result !== 'object') {
      throw new Error(`Моделировщик вернул некорректный тип: ${typeof result}`);
    }
    
    const { xml, warnings } = result;
    
    console.log('🔍 XML в результате:', xml);
    console.log('🔍 Warnings в результате:', warnings);
    
    // Проверяем xml более тщательно
    if (xml === undefined) {
      throw new Error('XML не определен (undefined) в результате');
    }
    
    if (xml === null) {
      throw new Error('XML равен null в результате');
    }
    
    if (typeof xml !== 'string') {
      throw new Error(`XML должен быть строкой, получен: ${typeof xml}`);
    }
    
    if (!xml.trim()) {
      throw new Error('XML пустой (только пробелы)');
    }

    console.log('✅ XML получен, длина:', xml && xml.length, 'символов');
    console.log('📋 Первые 200 символов XML:', xml && typeof xml === 'string' ? xml.substring(0, 200) : `XML не является строкой: ${typeof xml}`);


    if (warnings && Array.isArray(warnings) && warnings.length > 0) {
      console.warn('⚠️ Предупреждения при сохранении:', warnings);
    }

    console.log('📤 Отправка XML на сервер...');
    const res = await fetch('http://localhost:8081/diagram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml
    });

    console.log('📥 Статус ответа:', res.status, res.statusText);
    
    // Получаем текст ответа для детальной информации
    const responseText = await res.text();
    console.log('Текст ответа:', responseText);

    if (!res.ok) {
      // Детализируем ошибку
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      if (responseText) {
        errorMessage += ` - ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    console.log('✅ Схема успешно сохранена, ответ сервера:', responseText);
    alert('✅ Схема успешно сохранена!');
    
  } catch (err) {
    console.error('❌ Полная ошибка при сохранении схемы:', err);
    console.error('🔍 Стек вызовов:', err.stack);
    console.error('🔍 Тип ошибки:', err.name);
    
    // Более детальное сообщение для пользователя
    let userMessage = 'Ошибка при сохранении схемы.\n\n';
    
    if (err.message.includes('Cannot read properties of undefined') || 
        err.message.includes('XML не определен') ||
        err.message.includes('Моделировщик не вернул данные')) {
      userMessage += '❌ Ошибка данных: не удалось сгенерировать XML схему\n';
      userMessage += 'Возможные причины:\n';
      userMessage += '- Диаграмма пустая или повреждена\n';
      userMessage += '- Моделировщик не инициализирован\n';
      userMessage += '- Проблема с библиотекой bpmn-js\n\n';
    } else if (err.message.includes('XML должен быть строкой')) {
      userMessage += '❌ Некорректный формат данных\n';
      userMessage += `Моделировщик вернул: ${err.message.split('получен: ')[1]}\n\n`;
    } else if (err.message.includes('XML пустой')) {
      userMessage += '❌ Диаграмма пустая\n';
      userMessage += 'Добавьте элементы на схему перед сохранением\n\n';
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      userMessage += '❌ Ошибка соединения с сервером.\n';
      userMessage += 'Проверьте:\n';
      userMessage += '- Запущен ли backend сервер\n';
      userMessage += '- Адрес: http://backend:8081\n\n';
    } else if (err.message.includes('404')) {
      userMessage += '❌ Страница не найдена (404).\n';
      userMessage += 'Endpoint /diagram не существует на сервере\n\n';
    } else if (err.message.includes('500')) {
      userMessage += '❌ Ошибка на сервере (500).\n';
      userMessage += 'Проверьте логи backend сервера\n\n';
    }
    
    userMessage += `Техническая информация:\n${err.message}`;
    
    alert(userMessage);
  }
}

async function loadDiagram() {
  $('.message.intro').hide();

  try {
    const res = await fetch('http://localhost:8081/diagram');
    if (!res.ok) throw new Error('Ошибка загрузки с сервера');
    const xml = await res.text();
    await openDiagram(xml);
    console.log('Схема загружена с сервера');
  } catch (err) {
    console.error('Ошибка при загрузке схемы, загружаю по умолчанию:', err);
    await openDiagram(diagramXML);
  }
}

function registerFileDrop(container, callback) {
  function handleFileSelect(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  const element = container.get(0);
  element.addEventListener('dragover', handleDragOver, false);
  element.addEventListener('drop', handleFileSelect, false);
}

function setEncoded(link, name, data) {
  const encodedData = encodeURIComponent(data);
  if (data) {
    link.classList.add('active');
    link.setAttribute('href', 'data:text/xml;charset=UTF-8,' + encodedData);
    link.setAttribute('download', name);
  } else {
    link.classList.remove('active');
  }
}

function debounce(fn, timeout) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, timeout);
  };
}

const exportArtifacts = debounce(async () => {
  try {
    // Проверяем, что modeler инициализирован
    if (!modeler) {
      console.log('⚠️ Моделировщик не инициализирован, пропускаем экспорт');
      return;
    }

    const { svg } = await modeler.saveSVG();
    setEncoded(document.querySelector('#js-download-svg'), 'diagram.svg', svg);
  } catch (err) {
    console.error('Ошибка при сохранении SVG:', err);
    setEncoded(document.querySelector('#js-download-svg'), 'diagram.svg', null);
  }

  try {
    // Проверяем, что modeler инициализирован
    if (!modeler) {
      console.log('⚠️ Моделировщик не инициализирован, пропускаем экспорт XML');
      return;
    }

    const result = await modeler.saveXML({ format: true });

    // Сначала проверим, что вообще что-то вернулось
    if (!result) {
      console.error('⚠️ saveXML вернул undefined');
      throw new Error('saveXML не вернул данные — возможно, диаграмма пуста или модель не загружена.');
    }

    // Теперь можно безопасно достать xml
    const { xml, warnings } = result;

    // Проверим xml отдельно
    if (typeof xml !== 'string') {
      console.error('⚠️ saveXML вернул некорректный тип xml:', typeof xml, result);
      throw new Error(`XML должен быть строкой, а не ${typeof xml}`);
    }

    if (!xml.trim()) {
      console.error('⚠️ saveXML вернул пустой XML:', xml);
      throw new Error('XML пустой — возможно, диаграмма не содержит элементов.');
    }

    setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', xml);
  } catch (err) {
    console.error('Ошибка при сохранении XML:', err);
    setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', null);
  }
}, 500);

// --- Инициализация UI ---

async function setupUI() {
  if (!window.FileList || !window.FileReader) {
    alert(
      'Ваш браузер не поддерживает drag and drop. Используйте современные браузеры, например Chrome или Firefox.'
    );
  } else {
    registerFileDrop(container, openDiagram);
  }

  document.querySelector('#js-create-diagram')?.addEventListener('click', (e) => {
    e.preventDefault();
    openDiagram(diagramXML);
    $('.message.intro').hide();
  });

  document.querySelector('#save-button')?.addEventListener('click', saveDiagram);
  document.querySelector('#load-button')?.addEventListener('click', loadDiagram);

  document.querySelectorAll('.buttons a').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (!el.classList.contains('active')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });

  // Инициализируем modeler и устанавливаем слушатель событий только после инициализации
  try {
    await initializeModeler();
    modeler.on('commandStack.changed', exportArtifacts);
    console.log('✅ UI настроен и моделировщик готов к работе');
  } catch (err) {
    console.error('❌ Ошибка при настройке UI:', err);
  }
}

// --- Старт ---

window.addEventListener('DOMContentLoaded', async () => {
  await setupUI();
  await loadDiagram(); // Загружаем схему с сервера или по умолчанию
});
