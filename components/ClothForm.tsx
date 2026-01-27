'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ClothFormProps {
  onSubmit: (data: any) => Promise<{ success: boolean; data?: { id?: number }; id?: number } | void>;
  initialData?: any;
}

// UNIQLO 風格的類別
const CATEGORIES = [
  'T恤', '襯衫', '針織衫', '連帽衫', '外套', '大衣', '羽絨服',
  '褲子', '短褲', '裙子', '洋裝', '內衣', '襪子', '配件', '包包', '其他'
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free', '其他'];

const MATERIALS = [
  '棉', '聚酯纖維', '絲', '羊毛', '亞麻', '尼龍', '皮革', '其他'
];

const OCCASIONS = [
  '日常', '正式', '休閒', '運動', '派對', '工作', '約會', '其他'
];

const SEASONS = ['春', '夏', '秋', '冬'];

// 常用顏色（衣物常見顏色，10個）
const COMMON_COLORS = [
  { name: '黑色', value: '#000000' },
  { name: '白色', value: '#FFFFFF' },
  { name: '灰色', value: '#808080' },
  { name: '米色', value: '#F5F5DC' },
  { name: '卡其', value: '#C3B091' },
  { name: '藍色', value: '#0066CC' },
  { name: '深藍', value: '#000080' },
  { name: '紅色', value: '#DC143C' },
  { name: '粉色', value: '#FFC0CB' },
  { name: '綠色', value: '#228B22' },
];

export default function ClothForm({ onSubmit, initialData }: ClothFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);

  // 全局錯誤處理：捕獲未處理的 Promise rejection
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未處理的 Promise rejection:', event.reason);
      event.preventDefault(); // 防止在控制台顯示錯誤
    };

    const handleError = (event: ErrorEvent) => {
      console.error('全局錯誤:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
  // 移除選擇項，默認自動去背（保持透明背景）
  const [customCategory, setCustomCategory] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');
  const [autoDetectedColor, setAutoDetectedColor] = useState<string>(''); // 自動判定的顏色
  const [pickedColor, setPickedColor] = useState<string>(''); // 從圖片選取的顏色
  const [isColorPickerMode, setIsColorPickerMode] = useState(false); // 是否在取色模式
  const [showColorTable, setShowColorTable] = useState(false); // 是否顯示色表
  const [colorTableValue, setColorTableValue] = useState<string>(''); // 色表選擇的顏色
  const [availableBrands, setAvailableBrands] = useState<string[]>([]); // 可用的品牌列表
  const [drawers, setDrawers] = useState<Array<{ id: number; name: string }>>([]); // 抽屜列表
  const [selectedDrawerIds, setSelectedDrawerIds] = useState<Set<number>>(new Set()); // 選中的抽屜
  const [showDrawerDropdown, setShowDrawerDropdown] = useState(false); // 是否顯示抽屜下拉選單
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null); // 放大查看的圖片 URL

  // 創建隱藏的 input 元素引用（需要在函數之前定義）
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const backViewInputRef = useRef<HTMLInputElement>(null);
  const materialPhotoInputRef = useRef<HTMLInputElement>(null);
  const careLabelInputRef = useRef<HTMLInputElement>(null);
  const brandLabelInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    category: initialData?.category || '',
    color: initialData?.color || '',
    brand: initialData?.brand || '',
    size: initialData?.size || '',
    material: initialData?.material || '',
    occasion: initialData?.occasion || '',
    price: initialData?.price || '',
    purchase_date: initialData?.purchase_date || '',
    seasons: initialData?.seasons ? initialData.seasons.split(',') : [],
    notes: initialData?.notes || '',
    image_url: initialData?.image_url || '',
    image_processed_url: initialData?.image_processed_url || '',
    care_label_url: initialData?.care_label_url ? (Array.isArray(initialData.care_label_url) ? initialData.care_label_url.filter(Boolean) : initialData.care_label_url.split(',').filter(Boolean)) : [],
    brand_label_url: initialData?.brand_label_url ? (Array.isArray(initialData.brand_label_url) ? initialData.brand_label_url.filter(Boolean) : initialData.brand_label_url.split(',').filter(Boolean)) : [],
    back_view_url: initialData?.back_view_url ? (Array.isArray(initialData.back_view_url) ? initialData.back_view_url.filter(Boolean) : (typeof initialData.back_view_url === 'string' && initialData.back_view_url ? initialData.back_view_url.split(',').filter(Boolean) : [])) : [],
    material_photo_url: initialData?.material_photo_url ? (Array.isArray(initialData.material_photo_url) ? initialData.material_photo_url.filter(Boolean) : (typeof initialData.material_photo_url === 'string' && initialData.material_photo_url ? initialData.material_photo_url.split(',').filter(Boolean) : [])) : [],
  });

  // 獲取所有已存在的品牌
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/clothes');
        const result = await response.json();
        if (result.success) {
          const brandSet = new Set<string>();
          result.data.forEach((cloth: any) => {
            if (cloth.brand && cloth.brand.trim() !== '') {
              brandSet.add(cloth.brand.trim());
            }
          });
          setAvailableBrands(Array.from(brandSet).sort());
        }
      } catch (error) {
        console.error('獲取品牌列表失敗:', error);
      }
    };
    fetchBrands();
  }, []);

  // 獲取所有抽屜
  useEffect(() => {
    const fetchDrawers = async () => {
      try {
        const response = await fetch('/api/drawers');
        const result = await response.json();
        console.log('抽屜列表 API 回應:', result);
        if (result.success) {
          const drawersList = result.data || [];
          console.log('載入的抽屜:', drawersList);
          setDrawers(drawersList);
        } else {
          console.warn('獲取抽屜列表失敗:', result.error);
        }
      } catch (error) {
        console.error('獲取抽屜列表失敗:', error);
      }
    };
    fetchDrawers();
  }, []);

  // 草稿保存鍵名
  const DRAFT_STORAGE_KEY = 'cloth-form-draft';
  
  // 使用 ref 來追蹤是否已經恢復過草稿，避免恢復時觸發保存
  const hasRestoredDraftRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const isUploadingFileRef = useRef(false); // 追蹤是否正在上傳文件，避免草稿保存覆蓋

  // 從 localStorage 恢復草稿（僅在新增模式且沒有 initialData 時）
  useEffect(() => {
    if (!initialData && !hasRestoredDraftRef.current) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          console.log('恢復草稿:', draft);
          
          // 標記已經恢復過
          hasRestoredDraftRef.current = true;
          
          // 恢復表單數據
          if (draft.formData) {
            setFormData(draft.formData);
          }
          
          // 恢復自訂值
          if (draft.customCategory) setCustomCategory(draft.customCategory);
          if (draft.customSize) setCustomSize(draft.customSize);
          if (draft.customMaterial) setCustomMaterial(draft.customMaterial);
          if (draft.customOccasion) setCustomOccasion(draft.customOccasion);
          
          // 恢復抽屜選擇
          if (draft.selectedDrawerIds && Array.isArray(draft.selectedDrawerIds)) {
            setSelectedDrawerIds(new Set(draft.selectedDrawerIds));
          }
          
          // 恢復顏色相關
          if (draft.autoDetectedColor) setAutoDetectedColor(draft.autoDetectedColor);
          if (draft.pickedColor) setPickedColor(draft.pickedColor);
          
          // 恢復圖片旋轉
          if (typeof draft.imageRotation === 'number') {
            setImageRotation(draft.imageRotation);
          }
        } else {
          hasRestoredDraftRef.current = true; // 沒有草稿也要標記，避免後續檢查
        }
      } catch (error) {
        console.error('恢復草稿失敗:', error);
        hasRestoredDraftRef.current = true; // 出錯也要標記
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 保存草稿到 localStorage（僅在新增模式時，且已經恢復過草稿或沒有草稿）
  useEffect(() => {
    // 跳過初始掛載時的保存（避免覆蓋剛恢復的草稿）
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    
    // 如果正在上傳文件，跳過草稿保存（避免覆蓋新上傳的圖片）
    if (isUploadingFileRef.current) {
      console.log('⏸️ 跳過草稿保存（正在上傳文件）');
      return;
    }
    
    // 只在已經恢復過草稿（或確定沒有草稿）後才保存
    if (!initialData && hasRestoredDraftRef.current) {
      try {
        const draft = {
          formData,
          customCategory,
          customSize,
          customMaterial,
          customOccasion,
          selectedDrawerIds: Array.from(selectedDrawerIds),
          autoDetectedColor,
          pickedColor,
          imageRotation,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        console.log('💾 草稿已保存', { image_url: formData.image_url, image_processed_url: formData.image_processed_url });
      } catch (error) {
        console.error('保存草稿失敗:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, customCategory, customSize, customMaterial, customOccasion, selectedDrawerIds, autoDetectedColor, pickedColor, imageRotation]);

  // 清除草稿
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      hasRestoredDraftRef.current = false; // 重置恢復標記
      console.log('草稿已清除');
    } catch (error) {
      console.error('清除草稿失敗:', error);
    }
  };

  // 初始化自訂值（如果初始資料中有不在選項中的值）
  useEffect(() => {
    if (initialData) {
      if (initialData.category && !CATEGORIES.includes(initialData.category)) {
        setCustomCategory(initialData.category);
        setFormData(prev => ({ ...prev, category: '其他' }));
      }
      if (initialData.size && !SIZES.includes(initialData.size)) {
        setCustomSize(initialData.size);
        setFormData(prev => ({ ...prev, size: '其他' }));
      }
      if (initialData.material && !MATERIALS.includes(initialData.material)) {
        setCustomMaterial(initialData.material);
        setFormData(prev => ({ ...prev, material: '其他' }));
      }
      if (initialData.occasion && !OCCASIONS.includes(initialData.occasion)) {
        setCustomOccasion(initialData.occasion);
        setFormData(prev => ({ ...prev, occasion: '其他' }));
      }
      // 檢查顏色是否在常用顏色中
      if (initialData.color) {
        const colorMatch = COMMON_COLORS.find(c => c.value.toLowerCase() === initialData.color.toLowerCase());
        if (!colorMatch) {
          // 如果不在常用顏色中，嘗試匹配最接近的
          setFormData(prev => ({ ...prev, color: initialData.color }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSeasonToggle = (season: string) => {
    setFormData(prev => ({
      ...prev,
      seasons: prev.seasons.includes(season)
        ? prev.seasons.filter((s: string) => s !== season)
        : [...prev.seasons, season]
    }));
  };

  const toggleDrawerSelection = (drawerId: number) => {
    setSelectedDrawerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drawerId)) {
        newSet.delete(drawerId);
      } else {
        newSet.add(drawerId);
      }
      return newSet;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('⚠️ 沒有選擇文件');
      return;
    }

    console.log('📤 開始上傳新文件:', file.name, file.size);
    isUploadingFileRef.current = true; // 標記正在上傳文件
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();
      console.log('📥 上傳響應:', result);
      if (result.success) {
        console.log('✅ 上傳成功，準備更新狀態');
        // 先清除舊的去背圖片和相關狀態
        setAutoDetectedColor(''); // 清除舊的自動判定顏色
        setPickedColor(''); // 清除舊的選取顏色
        setImageRotation(0); // 重置旋轉角度
        setProcessing(false); // 重置處理狀態
        
        // 使用函數式更新，確保狀態正確更新
        // 強制清除 image_processed_url，即使新舊 URL 相同也要更新
        setFormData(prev => {
          const newState = {
            ...prev,
            image_url: result.data.imageUrl,
            image_processed_url: '', // 強制清除舊的去背圖片
          };
          console.log('🔄 更新圖片 URL:', {
            old_url: prev.image_url,
            new_url: result.data.imageUrl,
            old_processed: prev.image_processed_url,
            new_processed: '',
            state_changed: prev.image_url !== result.data.imageUrl || prev.image_processed_url !== '',
          });
          return newState;
        });
        
        // 清除草稿，避免恢復時覆蓋新上傳的圖片
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          console.log('🗑️ 已清除草稿（新文件上傳）');
        } catch (error) {
          console.error('清除草稿失敗:', error);
        }
        
        // 自動帶入顏色（如果提取到顏色）
        if (result.data.dominantColor) {
          const detectedColor = result.data.dominantColor.trim();
          
          if (detectedColor && detectedColor.startsWith('#')) {
            setAutoDetectedColor(detectedColor); // 儲存自動判定的顏色
            
            const colorMatch = COMMON_COLORS.find(c => 
              c.value.toLowerCase() === detectedColor.toLowerCase()
            );
            if (colorMatch) {
              // 如果在常用顏色中，直接設定為該常用顏色
              setFormData(prev => ({ ...prev, color: colorMatch.value }));
            } else {
              // 如果不在常用顏色中，設定為自動判定的顏色（會顯示在第12格）
              setFormData(prev => ({ ...prev, color: detectedColor }));
            }
          }
        }
      } else {
        alert('上傳失敗：' + result.error);
      }
    } catch (error) {
      console.error('上傳失敗:', error);
      alert('上傳失敗');
    } finally {
      setUploading(false);
      // 延遲重置上傳標記，確保狀態更新完成
      setTimeout(() => {
        isUploadingFileRef.current = false;
        console.log('✅ 文件上傳完成，恢復草稿保存');
      }, 100);
      // 重置 input，允許重複上傳相同文件
      if (e.target) {
        e.target.value = '';
      }
      // 同時重置 ref，確保下次選擇能觸發 onChange
      if (mainImageInputRef.current) {
        mainImageInputRef.current.value = '';
      }
      console.log('🔄 文件輸入已重置');
    }
  };

  // 處理洗標上傳（支持多張）
  const handleCareLabelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const result = await response.json();
        if (result.success) {
          return result.data.imageUrl;
        } else {
          throw new Error(result.error || '上傳失敗');
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        care_label_url: [...(prev.care_label_url as string[]), ...uploadedUrls],
      }));
    } catch (error: any) {
      console.error('上傳失敗:', error);
      alert('上傳失敗：' + (error.message || '請稍後再試'));
    } finally {
      setUploading(false);
      // 重置 input，允許重複上傳相同文件
      e.target.value = '';
    }
  };

  // OCR 識別品牌標文字
  const recognizeBrandFromImage = async (imageUrl: string): Promise<string | null> => {
    try {
      console.log('🔍 開始識別品牌標文字...');
      
      // 動態載入 Tesseract.js
      const tesseractModule = await import('tesseract.js');
      const Tesseract = tesseractModule.default;
      
      // 識別文字（支持中英文）
      const { data: { text } } = await Tesseract.recognize(imageUrl, 'eng+chi_sim', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`識別進度: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      console.log('✅ OCR 識別完成');
      console.log('識別到的文字:', text);

      // 清理文字：移除空白、換行，提取可能的品牌名稱
      const cleanedText = text
        .replace(/\s+/g, ' ')
        .trim()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0 && line.length < 50)
        .join(' ');

      // 嘗試提取品牌名稱
      const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      let brandName = null;

      // 策略1：取第一行非空文字（通常是品牌名）
      if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.length >= 2 && firstLine.length <= 30 && /[a-zA-Z\u4e00-\u9fa5]/.test(firstLine)) {
          brandName = firstLine;
        }
      }

      // 策略2：如果第一行不合適，找最長的行（可能是品牌名）
      if (!brandName && lines.length > 1) {
        const longestLine = lines.reduce((a: string, b: string) => a.length > b.length ? a : b);
        if (longestLine.length >= 2 && longestLine.length <= 30 && /[a-zA-Z\u4e00-\u9fa5]/.test(longestLine)) {
          brandName = longestLine;
        }
      }

      // 策略3：使用清理後的文字
      if (!brandName && cleanedText.length >= 2 && cleanedText.length <= 30) {
        brandName = cleanedText.split(' ')[0];
      }

      if (brandName) {
        console.log('✅ 識別到品牌:', brandName);
        return brandName;
      } else {
        console.log('⚠️ 未能識別出有效的品牌名稱');
        return null;
      }
    } catch (error: any) {
      console.error('❌ OCR 識別失敗:', error);
      // 如果模組未安裝，給出提示
      if (error.message && (error.message.includes('tesseract') || error.message.includes('Cannot find module'))) {
        console.warn('請先執行: npm install tesseract.js');
      }
      return null;
    }
  };

  // 處理品牌標上傳（支持多張，並自動識別品牌）
  const handleBrandLabelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 只取第一張圖片（替換模式）
    const fileToUpload = files[0];

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileToUpload);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();
      if (result.success) {
        const uploadedUrl = result.data.imageUrl;
        
        // 嘗試從圖片識別品牌
        if (!formData.brand) {
          console.log('🔍 開始自動識別品牌...');
          const recognizedBrand = await recognizeBrandFromImage(uploadedUrl);
          
          if (recognizedBrand) {
            setFormData(prev => ({
              ...prev,
              brand: recognizedBrand,
            }));
            console.log('✅ 品牌已自動填入:', recognizedBrand);
          } else {
            console.log('⚠️ 未能自動識別品牌，請手動輸入');
          }
        }
        
        // 替換現有圖片（只保留新上傳的）
        setFormData(prev => ({
          ...prev,
          brand_label_url: [uploadedUrl],
        }));
      } else {
        throw new Error(result.error || '上傳失敗');
      }
    } catch (error: any) {
      console.error('上傳失敗:', error);
      alert('上傳失敗：' + (error.message || '請稍後再試'));
    } finally {
      setUploading(false);
      // 重置 input，允許重複上傳相同文件
      e.target.value = '';
    }
  };

  // 通用圖片上傳處理函數
  const handleImageUpload = async (files: FileList, fieldName: 'back_view_url' | 'material_photo_url') => {
    if (!files || files.length === 0) return;

    // 單品背面照和材質照片只保留第一張（替換模式）
    const fileToUpload = files[0];

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileToUpload);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();
      if (result.success) {
        // 替換現有圖片（只保留新上傳的）
        setFormData(prev => ({
          ...prev,
          [fieldName]: [result.data.imageUrl],
        }));
      } else {
        throw new Error(result.error || '上傳失敗');
      }
    } catch (error: any) {
      console.error('上傳失敗:', error);
      alert('上傳失敗：' + (error.message || '請稍後再試'));
    } finally {
      setUploading(false);
    }
  };

  // 邊緣精細化處理函數：改善去背邊緣質量
  const refineEdges = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const img = document.createElement('img');
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
          try {
            // 創建 canvas 進行邊緣處理
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error('無法獲取 canvas context'));
              return;
            }

            // 限制 canvas 大小，避免記憶體問題
            const maxSize = 4096;
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
              const scale = Math.min(maxSize / width, maxSize / height);
              width = Math.floor(width * scale);
              height = Math.floor(height * scale);
            }

            canvas.width = width;
            canvas.height = height;
            
            // 繪製原圖
            ctx.drawImage(img, 0, 0, width, height);
            
            // 獲取圖像數據
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // 邊緣檢測和處理：去除半透明邊緣和背景殘留
            for (let i = 0; i < data.length; i += 4) {
              const alpha = data[i + 3];
              
              // 如果像素是半透明（可能是邊緣殘留），進行處理
              if (alpha > 0 && alpha < 255) {
                // 計算周圍像素的平均 alpha 值
                const x = (i / 4) % canvas.width;
                const y = Math.floor((i / 4) / canvas.width);
                
                let avgAlpha = 0;
                let count = 0;
                
                // 檢查周圍 3x3 區域
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                      const idx = (ny * canvas.width + nx) * 4;
                      avgAlpha += data[idx + 3];
                      count++;
                    }
                  }
                }
                
                if (count > 0) {
                  avgAlpha /= count;
                  
                  // 如果周圍大部分是透明或很透明，這個像素也應該更透明
                  // 如果周圍大部分是不透明，這個像素應該更不透明
                  if (avgAlpha < 128) {
                    // 邊緣過度區域，降低 alpha 或完全透明
                    data[i + 3] = Math.max(0, alpha - 20);
                  } else if (avgAlpha > 200) {
                    // 主體區域，增強 alpha
                    data[i + 3] = Math.min(255, alpha + 10);
                  }
                  
                  // 對於很暗的半透明像素（可能是背景殘留），降低 alpha
                  const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                  if (brightness < 30 && alpha < 180) {
                    data[i + 3] = Math.max(0, alpha - 30);
                  }
                }
              }
            }
            
            // 將處理後的數據放回 canvas
            ctx.putImageData(imageData, 0, 0);
            
            // 將 canvas 轉換為 Blob
            canvas.toBlob((resultBlob) => {
              URL.revokeObjectURL(url);
              if (resultBlob) {
                resolve(resultBlob);
              } else {
                reject(new Error('無法創建 Blob'));
              }
            }, 'image/png', 1.0);
          } catch (error: any) {
            URL.revokeObjectURL(url);
            console.error('邊緣處理內部錯誤:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        };
        
        img.onerror = (error) => {
          URL.revokeObjectURL(url);
          console.error('圖片載入錯誤:', error);
          reject(new Error('無法載入圖片'));
        };
        
        img.crossOrigin = 'anonymous';
        img.src = url;
      } catch (error: any) {
        console.error('refineEdges 初始化錯誤:', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  };

  // 將 AVIF 格式轉換為 PNG（removeBackground 不支持 AVIF）
  const convertAvifToPng = async (avifBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const url = URL.createObjectURL(avifBlob);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('無法獲取 canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('無法轉換為 PNG'));
            }
          }, 'image/png', 1.0);
        } catch (error: any) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('無法載入 AVIF 圖片'));
      };
      
      img.src = url;
    });
  };

  // 內部處理函數，接受圖片 URL 作為參數
  const handleRemoveBackgroundWithUrl = async (imageUrl: string) => {
    if (!imageUrl) {
      console.error('❌ 圖片 URL 不存在');
      setProcessing(false);
      return;
    }

    setProcessing(true);
    try {
      // 使用 Replicate API 進行去背
      console.log('🔄 開始使用 Replicate API 去背...');
      console.log('原始圖片:', imageUrl);
      
      const removeResponse = await fetch('/api/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });
      
      if (!removeResponse.ok) {
        const errorData = await removeResponse.json();
        throw new Error(errorData.error || '去背 API 調用失敗');
      }
      
      const removeResult = await removeResponse.json();
      
      if (!removeResult.success) {
        throw new Error(removeResult.error || '去背處理失敗');
      }
      
      const processedImageUrl = removeResult.data.imageUrl;
      console.log('✅ 去背完成！服務器已處理並上傳圖片');
      console.log('   - 去背圖片 URL:', processedImageUrl);
      
      // 下載圖片以提取顏色
      console.log('📥 下載圖片以提取顏色...');
      const response = await fetch(processedImageUrl);
      if (!response.ok) {
        console.warn('⚠️ 無法下載圖片進行顏色提取，跳過此步驟');
        // 即使顏色提取失敗，仍然更新去背圖片
        setFormData(prev => ({
          ...prev,
          image_processed_url: processedImageUrl,
        }));
        console.log('✅ 去背處理完成（跳過顏色提取）！');
        setProcessing(false);
        return;
      }
      
      const processedBlob = await response.blob();
      console.log('✅ 圖片下載成功');

      // 提取顏色（從去背後的圖片）
      console.log('🔄 開始提取顏色...');
      let detectedColor: string | null = null;
      try {
        const color = await extractColorFromBlob(processedBlob);
        if (color) {
          detectedColor = color.toUpperCase();
          console.log('✅ 顏色提取完成！');
          console.log('   - 提取的顏色:', detectedColor);
          if (detectedColor) {
            setAutoDetectedColor(detectedColor);
            const colorMatch = COMMON_COLORS.find(c => 
              c.value.toLowerCase() === detectedColor!.toLowerCase()
            );
            if (colorMatch) {
              setFormData(prev => ({ ...prev, color: colorMatch.value }));
              console.log('   - 匹配到常用顏色:', colorMatch.name);
            } else {
              setFormData(prev => ({ ...prev, color: detectedColor! }));
              console.log('   - 使用自動判定的顏色');
            }
          }
        } else {
          console.log('⚠️ 未能提取顏色');
        }
      } catch (colorError) {
        console.error('❌ 顏色提取失敗:', colorError);
      }
      
      // 更新表單數據
      setFormData(prev => ({
        ...prev,
        color: detectedColor || prev.color,
        image_processed_url: processedImageUrl,
      }));
      
      console.log('✅ 去背處理完成！');
    } catch (error: any) {
      console.error('❌ 處理流程失敗:', error);
      console.error('錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // 顯示更詳細的錯誤訊息
      let errorMessage = '去背處理失敗';
      if (error.message) {
        if (error.message.includes('Invalid format')) {
          errorMessage = '不支持的圖片格式。請使用 PNG、JPEG 或 WebP 格式。';
        } else if (error.message.includes('無法載入')) {
          errorMessage = '無法載入圖片，請檢查圖片 URL 是否正確。';
        } else {
          errorMessage = `去背處理失敗：${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };


  const rotateImage = (direction: 'left' | 'right') => {
    setImageRotation(prev => {
      if (direction === 'right') {
        return (prev + 90) % 360;
      } else {
        return (prev - 90 + 360) % 360;
      }
    });
  };

  const handleColorSelect = (colorValue: string) => {
    setFormData(prev => ({ ...prev, color: colorValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        category: formData.category === '其他' ? customCategory : formData.category,
        size: formData.size === '其他' ? customSize : formData.size,
        material: formData.material === '其他' ? customMaterial : formData.material,
        occasion: formData.occasion === '其他' ? customOccasion : formData.occasion,
        price: formData.price ? parseFloat(formData.price as string) : null,
        seasons: formData.seasons.join(','),
        care_label_url: (formData.care_label_url as string[]).filter(Boolean).length > 0 ? (formData.care_label_url as string[]).filter(Boolean).join(',') : null,
        brand_label_url: (formData.brand_label_url as string[]).filter(Boolean).length > 0 ? (formData.brand_label_url as string[]).filter(Boolean).join(',') : null,
        back_view_url: (formData.back_view_url as string[]).filter(Boolean).length > 0 ? (formData.back_view_url as string[]).filter(Boolean).join(',') : null,
        material_photo_url: (formData.material_photo_url as string[]).filter(Boolean).length > 0 ? (formData.material_photo_url as string[]).filter(Boolean).join(',') : null,
      };
      
      // 清理空字串，轉為 null
      Object.keys(submitData).forEach(key => {
        if (submitData[key as keyof typeof submitData] === '') {
          submitData[key as keyof typeof submitData] = null;
        }
      });
      
      const result = await onSubmit(submitData);
      
      // 如果成功，清除草稿並處理抽屜添加並跳轉
      if (result && typeof result === 'object' && 'success' in result && (result as { success: boolean }).success) {
        // 清除草稿
        clearDraft();
        // 如果選中了抽屜，將衣服添加到抽屜中
        if (selectedDrawerIds.size > 0) {
          try {
            // 嘗試從不同可能的結果結構中獲取 ID
            // API 返回: { success: true, data: { id: ... } }
            const resultData = result as { success: boolean; data?: { id?: number }; id?: number };
            const clothId = resultData.data?.id || resultData.id;
            
            if (clothId) {
              console.log('準備將衣服 ID:', clothId, '加入抽屜:', Array.from(selectedDrawerIds));
              
              // 將衣服添加到選中的抽屜（使用 Promise.all 並行處理）
              const drawerPromises = Array.from(selectedDrawerIds).map(async (drawerId) => {
                try {
                  const drawerRes = await fetch(`/api/drawers/${drawerId}`);
                  const drawerResult = await drawerRes.json();
                  
                  if (drawerResult.success) {
                    const drawer = drawerResult.data;
                    const currentClothIds = drawer.clothIds || [];
                    // 避免重複添加
                    if (!currentClothIds.includes(clothId)) {
                      const newClothIds = [...currentClothIds, clothId];
                      
                      const response = await fetch(`/api/drawers/${drawerId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clothIds: newClothIds }),
                      });

                      const updateResult = await response.json();
                      if (updateResult.success) {
                        console.log(`成功將衣服加入抽屜 ${drawer.name}`);
                      } else {
                        console.error(`更新抽屜失敗:`, updateResult);
                      }
                    } else {
                      console.log(`衣服已在抽屜 ${drawer.name} 中`);
                    }
                  } else {
                    console.error(`獲取抽屜失敗:`, drawerResult);
                  }
                } catch (error) {
                  console.error(`添加到抽屜 ${drawerId} 失敗:`, error);
                }
              });

              // 等待所有抽屜更新完成（最多等待 3 秒）
              await Promise.race([
                Promise.all(drawerPromises),
                new Promise(resolve => setTimeout(resolve, 3000))
              ]);
            } else {
              console.warn('無法獲取衣服 ID，結果:', result);
            }
          } catch (error) {
            console.error('添加到抽屜失敗:', error);
            // 不阻止表單提交，只記錄錯誤
          }
        }
        
        // 成功後跳轉到首頁
        router.push('/');
      } else if (selectedDrawerIds.size > 0) {
        console.warn('表單提交結果:', result, '選中的抽屜:', Array.from(selectedDrawerIds));
      }
    } catch (error: any) {
      console.error('提交失敗:', error);
      alert('提交失敗：' + (error.message || '未知錯誤'));
    } finally {
      setLoading(false);
    }
  };

  // 從 Blob 中提取主要顏色（改進算法，使用顏色頻率統計）
  const extractColorFromBlob = async (blob: Blob): Promise<string | null> => {
    try {
      // 使用 HTMLImageElement 而不是 Next.js 的 Image
      const img = document.createElement('img');
      const url = URL.createObjectURL(blob);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          resolve();
        };
        img.onerror = (error) => {
          URL.revokeObjectURL(url);
          reject(error);
        };
        img.crossOrigin = 'anonymous';
        img.src = url;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        URL.revokeObjectURL(url);
        return null;
      }
      
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
      
      // 縮小圖片以加快處理速度
      const resizedCanvas = document.createElement('canvas');
      const resizedCtx = resizedCanvas.getContext('2d', { willReadFrequently: true });
      if (!resizedCtx) {
        URL.revokeObjectURL(url);
        return null;
      }
      
      const size = 150; // 稍微增大採樣尺寸以提高準確性
      resizedCanvas.width = size;
      resizedCanvas.height = size;
      resizedCtx.drawImage(canvas, 0, 0, size, size);
      
      // 取得圖片統計資訊
      const imageData = resizedCtx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      // 使用加權平均計算主要顏色（給予更不透明的像素更多權重）
      let r = 0, g = 0, b = 0, totalWeight = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 10) { // 只計算有顏色的像素（alpha > 10）
          const weight = alpha / 255; // 權重基於不透明度
          r += data[i] * weight;
          g += data[i + 1] * weight;
          b += data[i + 2] * weight;
          totalWeight += weight;
        }
      }
      
      URL.revokeObjectURL(url);
      
      if (totalWeight === 0) {
        console.warn('沒有找到有效的顏色像素');
        return null;
      }
      
      // 計算加權平均顏色
      const avgR = Math.round(r / totalWeight);
      const avgG = Math.round(g / totalWeight);
      const avgB = Math.round(b / totalWeight);
      
      // 轉換為十六進位顏色碼
      const hexR = Math.max(0, Math.min(255, avgR)).toString(16).padStart(2, '0');
      const hexG = Math.max(0, Math.min(255, avgG)).toString(16).padStart(2, '0');
      const hexB = Math.max(0, Math.min(255, avgB)).toString(16).padStart(2, '0');
      
      const colorCode = `#${hexR}${hexG}${hexB}`.toUpperCase();
      console.log('提取的顏色:', colorCode, { r: avgR, g: avgG, b: avgB, totalWeight });
      return colorCode;
    } catch (error: any) {
      console.error('從 Blob 提取顏色失敗:', error);
      return null;
    }
  };

  // 從圖片指定位置提取顏色
  const extractColorFromImage = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isColorPickerMode) return;
    
    const container = event.currentTarget;
    const imgElement = container.querySelector('img');
    if (!imgElement) return;

    try {
      // 獲取容器和圖片的尺寸
      const containerRect = container.getBoundingClientRect();
      const imgRect = imgElement.getBoundingClientRect();
      
      // 計算點擊位置相對於圖片的座標
      const clickX = event.clientX - imgRect.left;
      const clickY = event.clientY - imgRect.top;
      
      // 創建 canvas 來讀取像素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 載入圖片到 canvas
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgElement.src;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 計算點擊位置對應的原始圖片座標
      // 考慮圖片的 object-contain 縮放
      const scaleX = img.width / imgRect.width;
      const scaleY = img.height / imgRect.height;
      const x = Math.floor(clickX * scaleX);
      const y = Math.floor(clickY * scaleY);

      // 確保座標在圖片範圍內
      const clampedX = Math.max(0, Math.min(x, img.width - 1));
      const clampedY = Math.max(0, Math.min(y, img.height - 1));

      // 獲取該位置的像素顏色
      const imageData = ctx.getImageData(clampedX, clampedY, 1, 1);
      const [r, g, b] = imageData.data;

      // 轉換為十六進位顏色碼
      const hexR = r.toString(16).padStart(2, '0');
      const hexG = g.toString(16).padStart(2, '0');
      const hexB = b.toString(16).padStart(2, '0');
      const colorCode = `#${hexR}${hexG}${hexB}`;

      setPickedColor(colorCode);
      
      // 檢查是否在常用顏色中
      const colorMatch = COMMON_COLORS.find(c => 
        c.value.toLowerCase() === colorCode.toLowerCase()
      );
      
      if (colorMatch) {
        // 如果在常用顏色中，直接設定
        setFormData(prev => ({ ...prev, color: colorMatch.value }));
      } else {
        // 如果不在常用顏色中，設定為選取的顏色
        setFormData(prev => ({ ...prev, color: colorCode }));
      }
      
      setIsColorPickerMode(false); // 關閉取色模式
    } catch (error) {
      console.error('取色失敗:', error);
      alert('取色失敗，請重試');
      setIsColorPickerMode(false);
    }
  };

  // 檢查是否有自動判定的顏色且不在常用顏色中
  const hasAutoDetectedNotInCommon = () => {
    if (!autoDetectedColor || !autoDetectedColor.trim()) return false;
    return !COMMON_COLORS.some(c => 
      c.value.toLowerCase() === autoDetectedColor.toLowerCase()
    );
  };

  // 檢查是否有選取的顏色且不在常用顏色中
  const hasPickedColorNotInCommon = () => {
    if (!pickedColor || !pickedColor.trim()) return false;
    return !COMMON_COLORS.some(c => 
      c.value.toLowerCase() === pickedColor.toLowerCase()
    );
  };

  // 檢查當前選中的顏色是否是自動判定的顏色
  const isAutoDetectedColor = () => {
    if (!formData.color || !autoDetectedColor) return false;
    return formData.color.toLowerCase() === autoDetectedColor.toLowerCase();
  };

  // 檢查當前選中的顏色是否是自訂顏色
  const isCustomColor = () => {
    if (!formData.color) return false;
    // 如果顏色不在常用顏色中，且不是自動判定的顏色，就是自訂顏色
    const isInCommon = COMMON_COLORS.some(c => 
      c.value.toLowerCase() === formData.color.toLowerCase()
    );
    return !isInCommon && !isAutoDetectedColor();
  };

  // 檢查顏色是否在常用顏色中
  const isColorInCommon = () => {
    if (!formData.color) return false;
    return COMMON_COLORS.some(c => c.value.toLowerCase() === formData.color.toLowerCase());
  };

  return (
    <form onSubmit={handleSubmit} className="glass-effect rounded-3xl shadow-2xl p-6 md:p-8 lg:p-12 relative overflow-hidden border border-white/30">
      {/* 精緻的裝飾性背景 */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-200/15 via-slate-200/12 to-stone-200/10 rounded-full blur-3xl -z-0 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-slate-200/15 via-slate-200/12 to-stone-200/10 rounded-full blur-3xl -z-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-slate-100/8 via-slate-100/5 to-stone-100/5 rounded-full blur-3xl -z-0"></div>
      
      <div className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* 左側：照片 */}
        <div className="space-y-4">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              衣服照片
            </label>
            
            {/* 隱藏的文件輸入框 */}
            <input
              ref={mainImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                console.log('🔔 onChange 事件觸發！', {
                  file: e.target.files?.[0]?.name,
                  uploading,
                  processing,
                  currentImageUrl: formData.image_url,
                  currentProcessedUrl: formData.image_processed_url,
                });
                handleFileUpload(e);
              }}
              className="hidden"
            />
            
            {/* 自定義按鈕來觸發文件選擇 - 始終顯示 */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ 點擊選擇文件按鈕', {
                  uploading,
                  processing,
                  refExists: !!mainImageInputRef.current,
                  inputDisabled: mainImageInputRef.current?.disabled,
                });
                
                if (uploading || processing) {
                  console.warn('⚠️ 按鈕被禁用，無法選擇文件');
                  alert('正在處理中，請稍候...');
                  return;
                }
                
                if (mainImageInputRef.current) {
                  console.log('📁 觸發文件輸入框點擊');
                  try {
                    mainImageInputRef.current.click();
                    console.log('✅ 文件輸入框點擊已觸發');
                  } catch (error) {
                    console.error('❌ 觸發文件輸入框失敗:', error);
                    alert('無法打開文件選擇器：' + error);
                  }
                } else {
                  console.error('❌ 文件輸入框 ref 不存在');
                  alert('文件輸入框未初始化，請刷新頁面');
                }
              }}
              disabled={uploading || processing}
              className="w-full px-6 py-4 rounded-xl border-2 border-dashed border-slate-400 hover:border-slate-500 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all duration-200 flex items-center justify-center gap-3 text-slate-700 font-bold text-base shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              style={{ 
                pointerEvents: uploading || processing ? 'none' : 'auto',
                minHeight: '60px',
                zIndex: 10,
                position: 'relative',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-lg">
                {uploading ? '上傳中...' : processing ? '處理中...' : '選擇檔案'}
              </span>
            </button>
            
            {uploading && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">上傳中...</span>
              </div>
            )}
          </div>

          <div 
            className={`relative bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-300 ${
              isColorPickerMode 
                ? 'cursor-crosshair border-slate-500 shadow-lg shadow-slate-500/20' 
                : 'border-gray-300 hover:border-gray-400 hover:shadow-lg'
            }`}
            style={{ width: '100%', aspectRatio: '1 / 1' }}
            onClick={extractColorFromImage}
          >
            {(formData.image_processed_url || formData.image_url) ? (
              <>
                <div
                  className="relative w-full h-full cursor-pointer"
                  style={{
                    transform: `rotate(${imageRotation}deg)`,
                    transition: 'transform 0.3s ease',
                  }}
                  onClick={() => setEnlargedImage(formData.image_processed_url || formData.image_url)}
                >
                  <Image
                    key={`${formData.image_url}-${formData.image_processed_url || 'none'}`} // 使用组合 key 强制重新渲染
                    src={formData.image_processed_url || formData.image_url}
                    alt="預覽"
                    fill
                    style={{ objectFit: 'contain' }}
                    className="hover:opacity-90 transition-opacity"
                    unoptimized // 避免 Next.js 图片优化导致的缓存问题
                  />
                </div>
                {isColorPickerMode && (
                  <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-gradient-to-r from-slate-400 to-slate-600 text-white px-6 py-3 rounded-xl shadow-xl backdrop-blur-md animate-pulse">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <span className="font-medium">點擊圖片上的位置來選取顏色</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateImage('left');
                    }}
                    className="bg-white/95 backdrop-blur-sm hover:bg-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700 transition-all hover:shadow-xl hover:scale-105 active:scale-95"
                    title="逆時針旋轉"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                    左轉
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateImage('right');
                    }}
                    className="bg-white/95 backdrop-blur-sm hover:bg-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium text-gray-700 transition-all hover:shadow-xl hover:scale-105 active:scale-95"
                    title="順時針旋轉"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    右轉
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">尚未選擇圖片</p>
              </div>
            )}
          </div>
          
          {/* 去背按鈕（只在有原始圖片且未去背時顯示） */}
          {formData.image_url && !formData.image_processed_url && (
            <button
              type="button"
              onClick={() => {
                if (formData.image_url) {
                  handleRemoveBackgroundWithUrl(formData.image_url);
                }
              }}
              disabled={processing}
              className={`w-full mt-4 py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                processing
                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700 hover:shadow-xl'
              }`}
            >
              {processing ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>正在去背...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>一鍵去背</span>
                </>
              )}
            </button>
          )}

          {processing && formData.image_processed_url && (
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1 mt-2">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>正在處理：去背...</span>
            </p>
          )}

          {/* 圖片分類上傳按鈕 */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            {/* 隱藏的 input 元素 */}
            <input
              ref={backViewInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'back_view_url')}
              className="hidden"
            />
            <input
              ref={brandLabelInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBrandLabelUpload}
              className="hidden"
            />
            <input
              ref={careLabelInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleCareLabelUpload}
              className="hidden"
            />
            <input
              ref={materialPhotoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'material_photo_url')}
              className="hidden"
            />

            {/* 單品背面照 */}
            <div className="relative">
              {(formData.back_view_url as string[]).filter(Boolean).length > 0 && (formData.back_view_url as string[])[0] ? (
                <div className="relative bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer" style={{ aspectRatio: '1', minHeight: '120px' }}>
                  <Image 
                    src={(formData.back_view_url as string[]).filter(Boolean)[0]} 
                    alt="單品背面照" 
                    fill 
                    style={{ objectFit: 'contain' }} 
                    className="p-2 hover:opacity-80 transition-opacity" 
                    onClick={() => setEnlargedImage((formData.back_view_url as string[]).filter(Boolean)[0])}
                    onError={(e) => {
                      console.error('背面照片加載失敗:', (formData.back_view_url as string[])[0]);
                      // 圖片加載失敗時的處理 - 從數組中移除無效的 URL
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setFormData(prev => ({ ...prev, back_view_url: [] }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, back_view_url: [] }));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-lg z-20"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      backViewInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="absolute bottom-1 left-1 right-1 bg-black/50 hover:bg-black/70 text-white text-xs py-1 px-2 rounded transition-all disabled:opacity-50 z-20"
                  >
                    更換
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => backViewInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full" style={{ aspectRatio: '1', minHeight: '120px' }}
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">單品背面照</span>
                </button>
              )}
            </div>

            {/* 領口品牌標 */}
            <div className="relative">
              {(formData.brand_label_url as string[]).filter(Boolean).length > 0 && (formData.brand_label_url as string[])[0] ? (
                <div className="relative bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer" style={{ aspectRatio: '1', minHeight: '120px' }}>
                  <Image 
                    src={(formData.brand_label_url as string[]).filter(Boolean)[0]} 
                    alt="領口品牌標" 
                    fill 
                    style={{ objectFit: 'contain' }} 
                    className="p-2 hover:opacity-80 transition-opacity" 
                    onClick={() => setEnlargedImage((formData.brand_label_url as string[]).filter(Boolean)[0])}
                    onError={(e) => {
                      console.error('品牌標加載失敗:', (formData.brand_label_url as string[])[0]);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setFormData(prev => ({ ...prev, brand_label_url: [] }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, brand_label_url: [] }));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-lg z-20"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      brandLabelInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="absolute bottom-1 left-1 right-1 bg-black/50 hover:bg-black/70 text-white text-xs py-1 px-2 rounded transition-all disabled:opacity-50 z-20"
                  >
                    更換
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => brandLabelInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full" style={{ aspectRatio: '1', minHeight: '120px' }}
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">領口品牌標</span>
                </button>
              )}
            </div>

            {/* 洗標（支持多張） */}
            <div className="relative">
              {(formData.care_label_url as string[]).filter(Boolean).length > 0 && (formData.care_label_url as string[])[0] ? (
                <div className="relative bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer" style={{ aspectRatio: '1', minHeight: '120px' }}>
                  <Image 
                    src={(formData.care_label_url as string[]).filter(Boolean)[0]} 
                    alt="洗標" 
                    fill 
                    style={{ objectFit: 'contain' }} 
                    className="p-2 hover:opacity-80 transition-opacity" 
                    onClick={() => setEnlargedImage((formData.care_label_url as string[]).filter(Boolean)[0])}
                    onError={(e) => {
                      console.error('洗標加載失敗:', (formData.care_label_url as string[])[0]);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setFormData(prev => ({ ...prev, care_label_url: [] }));
                    }}
                  />
                  {(formData.care_label_url as string[]).filter(Boolean).length > 1 && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      +{(formData.care_label_url as string[]).filter(Boolean).length - 1}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentUrls = formData.care_label_url as string[];
                      if (currentUrls.length > 1) {
                        // 如果有多張，只刪除第一張
                        setFormData(prev => ({ ...prev, care_label_url: (prev.care_label_url as string[]).slice(1) }));
                      } else {
                        // 如果只有一張，清空
                        setFormData(prev => ({ ...prev, care_label_url: [] }));
                      }
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-lg z-20"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      careLabelInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="absolute bottom-1 left-1 right-1 bg-black/50 hover:bg-black/70 text-white text-xs py-1 px-2 rounded transition-all disabled:opacity-50 z-20"
                  >
                    {(formData.care_label_url as string[]).length > 1 ? '新增' : '更換'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => careLabelInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full" style={{ aspectRatio: '1', minHeight: '120px' }}
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">洗標</span>
                </button>
              )}
            </div>

            {/* 材質照片 */}
            <div className="relative">
              {(formData.material_photo_url as string[]).filter(Boolean).length > 0 && (formData.material_photo_url as string[])[0] ? (
                <div className="relative bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer" style={{ aspectRatio: '1', minHeight: '120px' }}>
                  <Image 
                    src={(formData.material_photo_url as string[]).filter(Boolean)[0]} 
                    alt="材質照片" 
                    fill 
                    style={{ objectFit: 'contain' }} 
                    className="p-2 hover:opacity-80 transition-opacity" 
                    onClick={() => setEnlargedImage((formData.material_photo_url as string[]).filter(Boolean)[0])}
                    onError={(e) => {
                      console.error('材質照片加載失敗:', (formData.material_photo_url as string[])[0]);
                      // 圖片加載失敗時的處理 - 從數組中移除無效的 URL
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setFormData(prev => ({ ...prev, material_photo_url: [] }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, material_photo_url: [] }));
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-lg z-20"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      materialPhotoInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="absolute bottom-1 left-1 right-1 bg-black/50 hover:bg-black/70 text-white text-xs py-1 px-2 rounded transition-all disabled:opacity-50 z-20"
                  >
                    更換
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => materialPhotoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full" style={{ aspectRatio: '1', minHeight: '120px' }}
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">材質照片</span>
                </button>
              )}
            </div>
          </div>

          {/* 顯示洗標的多張圖片預覽（其他類別已在格子內顯示） */}
          {(formData.care_label_url as string[]).length > 1 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">洗標 ({(formData.care_label_url as string[]).length})</h4>
              <div className="grid grid-cols-2 gap-3">
                {(formData.care_label_url as string[]).map((url, index) => (
                  <div key={index} className="relative bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer" style={{ width: '100%', aspectRatio: '4 / 3', maxHeight: '150px' }}>
                    <Image 
                      src={url} 
                      alt={`洗標 ${index + 1}`} 
                      fill 
                      style={{ objectFit: 'contain' }} 
                      className="p-2 hover:opacity-80 transition-opacity" 
                      onClick={() => setEnlargedImage(url)}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, care_label_url: (prev.care_label_url as string[]).filter((_, i) => i !== index) }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-lg z-10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右側：表單內容 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 類別 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                類別
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700 font-medium"
              >
                <option value="">請選擇類別</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {formData.category === '其他' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="請輸入類別"
                  className="w-full mt-3 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700"
                />
              )}
            </div>

            {/* 品牌 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                品牌
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="brand"
                  list="brand-list"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="選擇或輸入品牌，例如：UNIQLO"
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all bg-white hover:border-stone-300 text-stone-700 pr-10"
                />
                {availableBrands.length > 0 && (
                  <datalist id="brand-list">
                    {availableBrands.map(brand => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>
                )}
                {availableBrands.length > 0 && formData.brand && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {availableBrands.includes(formData.brand) ? (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {availableBrands.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">快速選擇：</span>
                  {availableBrands.slice(0, 5).map(brand => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, brand }))}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-all duration-200 ${
                        formData.brand === brand
                          ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white shadow-md scale-105'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                  {availableBrands.length > 5 && (
                    <span className="text-xs text-gray-400 self-center">+{availableBrands.length - 5} 個</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 顏色 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                顏色 <span className="text-xs text-gray-500">(會自動帶入,可改)</span>
              </label>
              <div className="grid grid-cols-6 gap-2.5 mb-3 p-3 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border border-stone-200">
                {/* 前10格：常用顏色 */}
                {COMMON_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorSelect(color.value)}
                    className={`relative w-full aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${
                      formData.color === color.value
                        ? 'border-slate-500 ring-4 ring-slate-200 shadow-lg scale-110 z-10'
                        : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {formData.color === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white drop-shadow-2xl" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
                
                {/* 第11格：自動判定的顏色 */}
                {autoDetectedColor ? (
                  <button
                    key="auto-detected"
                    type="button"
                    onClick={() => handleColorSelect(autoDetectedColor)}
                    className={`relative w-full aspect-square rounded-lg border-2 transition-all ${
                      formData.color === autoDetectedColor
                        ? 'border-slate-500 ring-2 ring-slate-300 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: autoDetectedColor }}
                    title="自動判定"
                  >
                    {formData.color === autoDetectedColor && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      A
                    </div>
                  </button>
                ) : (
                  <div className="relative w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                    <span className="text-xs text-gray-400">自動</span>
                  </div>
                )}
                
                {/* 第12格：色表選擇器 */}
                <div className="relative w-full aspect-square">
                  <button
                    type="button"
                    onClick={() => setShowColorTable(!showColorTable)}
                    className={`relative w-full h-full rounded-lg border-2 transition-all ${
                      (colorTableValue && formData.color === colorTableValue) || 
                      (formData.color && !COMMON_COLORS.some(c => c.value.toLowerCase() === formData.color.toLowerCase()) && formData.color !== autoDetectedColor && formData.color !== pickedColor)
                        ? 'border-slate-500 ring-2 ring-slate-300 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={colorTableValue ? { backgroundColor: colorTableValue } : (formData.color && !COMMON_COLORS.some(c => c.value.toLowerCase() === formData.color.toLowerCase()) && formData.color !== autoDetectedColor && formData.color !== pickedColor ? { backgroundColor: formData.color } : { backgroundColor: '#f3f4f6' })}
                    title="色表"
                  >
                    {colorTableValue && formData.color === colorTableValue && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {!colorTableValue && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      🎨
                    </div>
                  </button>
                  
                  {/* 色表選擇器彈窗 */}
                  {showColorTable && (
                    <div className="absolute z-50 top-full left-0 mt-2 p-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl" style={{ width: '280px' }}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-700">選擇顏色</span>
                        <button
                          type="button"
                          onClick={() => setShowColorTable(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="color"
                        value={colorTableValue || formData.color || '#808080'}
                        onChange={(e) => {
                          const newColor = e.target.value.toUpperCase();
                          setColorTableValue(newColor);
                          setFormData(prev => ({ ...prev, color: newColor }));
                        }}
                        className="w-full h-32 cursor-pointer mb-3"
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          value={colorTableValue || formData.color || ''}
                          onChange={(e) => {
                            const newColor = e.target.value.trim().toUpperCase();
                            if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                              setColorTableValue(newColor);
                              setFormData(prev => ({ ...prev, color: newColor }));
                            } else if (newColor === '') {
                              setColorTableValue('');
                            } else {
                              // 允許正在輸入的狀態
                              setColorTableValue(newColor);
                            }
                          }}
                          onBlur={(e) => {
                            const newColor = e.target.value.trim().toUpperCase();
                            if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                              setColorTableValue(newColor);
                              setFormData(prev => ({ ...prev, color: newColor }));
                            } else if (newColor === '') {
                              setColorTableValue('');
                            } else {
                              // 如果格式不正確，恢復為當前顏色
                              setColorTableValue(formData.color || '');
                            }
                          }}
                          placeholder="#000000"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowColorTable(false);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          確定
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* 顯示當前選中的顏色資訊 */}
              {formData.color && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center gap-2 text-sm">
                  <div
                    className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-gray-700">{formData.color}</span>
                  {formData.color === autoDetectedColor && (
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">自動判定</span>
                  )}
                  {formData.color === pickedColor && (
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">圖片選取</span>
                  )}
                  {formData.color !== autoDetectedColor && formData.color !== pickedColor && !COMMON_COLORS.some(c => c.value.toLowerCase() === formData.color.toLowerCase()) && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">自訂</span>
                  )}
                </div>
              )}
            </div>

            {/* 尺寸 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                尺寸
              </label>
              <select
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700 font-medium"
              >
                <option value="">請選擇尺寸</option>
                {SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              {formData.size === '其他' && (
                <input
                  type="text"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder="請輸入尺寸"
                  className="w-full mt-3 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 材質 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                材質
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700 font-medium"
              >
                <option value="">請選擇材質</option>
                {MATERIALS.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
              {formData.material === '其他' && (
                <input
                  type="text"
                  value={customMaterial}
                  onChange={(e) => setCustomMaterial(e.target.value)}
                  placeholder="請輸入材質"
                  className="w-full mt-3 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700"
                />
              )}
            </div>

            {/* 場合 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                場合
              </label>
              <select
                name="occasion"
                value={formData.occasion}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700 font-medium"
              >
                <option value="">請選擇場合</option>
                {OCCASIONS.map(occasion => (
                  <option key={occasion} value={occasion}>{occasion}</option>
                ))}
              </select>
              {formData.occasion === '其他' && (
                <input
                  type="text"
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  placeholder="請輸入場合"
                  className="w-full mt-3 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 價格 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                價格
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700"
                />
              </div>
            </div>

            {/* 購買日期 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                購買日期
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 季節 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                季節（可多選）
              </label>
              <div className="flex flex-wrap gap-2.5">
                {SEASONS.map(season => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => handleSeasonToggle(season)}
                    className={`px-5 py-2.5 rounded-xl border-2 font-medium transition-all duration-200 ${
                      formData.seasons.includes(season)
                      ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white border-slate-400 shadow-lg shadow-slate-400/30 scale-105'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-slate-300 hover:bg-slate-50 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            {/* 加入抽屜（可選） */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                加入抽屜（可選）
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDrawerDropdown(!showDrawerDropdown)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300 text-gray-700 flex items-center justify-between"
                >
                  <span className={selectedDrawerIds.size > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                    {selectedDrawerIds.size > 0
                      ? `已選擇 ${selectedDrawerIds.size} 個抽屜${selectedDrawerIds.size <= 3 ? `：${Array.from(selectedDrawerIds).map(id => drawers.find(d => d.id === id)?.name).filter(Boolean).join('、')}` : ''}`
                      : drawers.length > 0
                      ? '請選擇抽屜（可多選）'
                      : '還沒有抽屜'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showDrawerDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 下拉選單 */}
                {showDrawerDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDrawerDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-2xl max-h-64 overflow-y-auto">
                      {drawers.length > 0 ? (
                        <>
                          <div className="p-2 border-b border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedDrawerIds.size === drawers.length) {
                                  setSelectedDrawerIds(new Set());
                                } else {
                                  setSelectedDrawerIds(new Set(drawers.map(d => d.id)));
                                }
                              }}
                              className="w-full px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              {selectedDrawerIds.size === drawers.length ? '取消全選' : '全選'}
                            </button>
                          </div>
                          <div className="p-2">
                            {drawers.map((drawer) => {
                              const isSelected = selectedDrawerIds.has(drawer.id);
                              return (
                                <label
                                  key={drawer.id}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleDrawerSelection(drawer.id)}
                                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                  />
                                  <span className={`flex-1 font-medium ${isSelected ? 'text-purple-600' : 'text-gray-700'}`}>
                                    {drawer.name}
                                  </span>
                                  {isSelected && (
                                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="p-6 text-center">
                          <p className="text-sm text-gray-500 mb-2">還沒有抽屜</p>
                          <p className="text-xs text-gray-400">可到「衣櫥」頁面創建</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              備註
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="輸入任何額外資訊..."
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all bg-white hover:border-stone-300 text-stone-700 resize-none"
            />
          </div>
        </div>
      </div>
      </div>

      {/* 按鈕 */}
      <div className="relative z-10 pt-6 border-t border-stone-200 mt-8">
        {/* 清除草稿提示（僅在新增模式且有草稿時顯示） */}
        {!initialData && (() => {
          try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            return savedDraft ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>已恢復草稿，可繼續編輯</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('確定要清除草稿嗎？這將重置所有欄位。')) {
                      clearDraft();
                      // 重置表單
                      setFormData({
                        category: '',
                        color: '',
                        brand: '',
                        size: '',
                        material: '',
                        occasion: '',
                        price: '',
                        purchase_date: '',
                        seasons: [],
                        notes: '',
                        image_url: '',
                        image_processed_url: '',
                        care_label_url: [],
                        brand_label_url: [],
                        back_view_url: [],
                        material_photo_url: [],
                      });
                      setCustomCategory('');
                      setCustomSize('');
                      setCustomMaterial('');
                      setCustomOccasion('');
                      setSelectedDrawerIds(new Set());
                      setAutoDetectedColor('');
                      setPickedColor('');
                      setImageRotation(0);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all"
                >
                  清除草稿
                </button>
              </div>
            ) : null;
          } catch {
            return null;
          }
        })()}
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:shadow-md active:scale-95 border-2 border-stone-200"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-500 hover:to-slate-700 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>處理中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>儲存</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 圖片放大查看 Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={enlargedImage}
              alt="放大查看"
              width={1920}
              height={1920}
              style={{ 
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              className="rounded-lg shadow-2xl"
              unoptimized
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEnlargedImage(null);
              }}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all hover:scale-110 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
