// hooks/useReceiptProcessing.ts
import { useState, useEffect } from 'react';
import { analyzeReceipt, submitFeedback, ReceiptData } from '../service/ReceiptService';

export const useReceiptProcessing = (imageUrl: string | null) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processReceipt = async () => {
      if (!imageUrl) return;

      try {
        setIsProcessing(true);
        const data = await analyzeReceipt(imageUrl);
        setReceiptData(data);
      } catch (err) {
        setError('Failed to process receipt');
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };

    processReceipt();
  }, [imageUrl]);

  const submitCorrections = async (corrections: ReceiptData) => {
    if (!receiptData) return;
    
    try {
      await submitFeedback(imageUrl!, corrections);
      setReceiptData(corrections);
    } catch (err) {
      console.error('Error submitting corrections:', err);
      throw err;
    }
  };

  return { isProcessing, receiptData, error, submitCorrections };
};