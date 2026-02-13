import { useState, useRef } from 'react';
import api from '@/utils/api';
import { extractFileName, BoardIdentity, DataIdentity } from '@/utils/filename';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadFileProps {
  onComplete: (identity: BoardIdentity | DataIdentity) => void;
}

export default function UploadFile({ onComplete }: UploadFileProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    setFile(f);
    setProgress(0);
    setResultUrl('');
    setError('');
    
    // Auto start upload like in the original
    await upload(f);
  };

  const upload = async (f: File) => {
    try {
      setUploading(true);
      const identity = extractFileName(f.name);
      
      const res = await api.uploadFile(f, {
        onProgress: (p) => setProgress(p * 100),
      });

      setResultUrl(res.data?.url ?? '');
      onComplete(identity);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message ?? err?.message ?? '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>文件上传</CardTitle>
        <CardDescription>务必确保文件名符合平时的规范</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <Input 
            ref={fileInputRef}
            type="file" 
            onChange={handleFileChange} 
            disabled={uploading}
            className="cursor-pointer"
          />
          
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>上传中...</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {resultUrl && (
            <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>上传成功</AlertTitle>
              <AlertDescription className="break-all font-mono text-xs">
                {resultUrl}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
