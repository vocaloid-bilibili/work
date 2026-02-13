import { useState } from 'react';
import api from '@/utils/api';
import { BoardIdentity, DataIdentity, isBoardIdentity, isDataIdentity } from '@/utils/filename';
import UploadFile from '@/components/UploadFile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Upload() {
  // Board State
  const [boardIdentity, setBoardIdentity] = useState<BoardIdentity | null>(null);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [boardCheckStatus, setBoardCheckStatus] = useState<'success' | 'failed' | ''>('');
  const [boardCheckError, setBoardCheckError] = useState('');
  const [boardUpdateStatus, setBoardUpdateStatus] = useState<'success' | 'failed' | 'updating' | ''>('');
  const [boardUpdateError, setBoardUpdateError] = useState('');
  const [boardChecking, setBoardChecking] = useState(false);
  const [boardUpdating, setBoardUpdating] = useState(false);
  const [boardProgress, setBoardProgress] = useState('');

  // Data State
  const [dataIdentity, setDataIdentity] = useState<DataIdentity | null>(null);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState<'success' | 'failed' | 'processing' | ''>('');
  const [dataError, setDataError] = useState('');
  // const [dataProcessing, setDataProcessing] = useState(false);

  const boards: Record<string, string> = {
    'vocaloid-daily': '日刊',
    'vocaloid-weekly': '周刊',
    'vocaloid-monthly': '月刊',
  };

  const parts: Record<string, string> = {
    'main': '主榜',
    'new': '新曲榜',
  };

  const handleUploadComplete = (identity: BoardIdentity | DataIdentity) => {
    if (isBoardIdentity(identity)) {
      setBoardIdentity(identity);
      setBoardCheckStatus('');
      setBoardUpdateStatus('');
      setBoardCheckError('');
      setBoardUpdateError('');
      setBoardProgress('');
      setBoardDialogOpen(true);
    } else if (isDataIdentity(identity)) {
      setDataIdentity(identity);
      setDataStatus('');
      setDataError('');
      setDataDialogOpen(true);
      handleDataProcess(identity); // Start immediately
    }
  };

  const handleBoardCheck = async () => {
    if (!boardIdentity) return;
    setBoardChecking(true);
    try {
      const res = await api.checkFile(boardIdentity.board, boardIdentity.part, boardIdentity.issue);
      if (res.detail === '') {
        setBoardCheckStatus('success');
        setBoardCheckError('');
      } else {
        setBoardCheckStatus('failed');
        setBoardCheckError(res.detail);
      }
    } catch (err: any) {
      setBoardCheckStatus('failed');
      setBoardCheckError(err?.response?.data?.message || err.message || '检查失败');
    } finally {
      setBoardChecking(false);
    }
  };

  const handleBoardUpdate = async () => {
    if (!boardIdentity) return;
    setBoardUpdating(true);
    setBoardUpdateStatus('updating');
    setBoardProgress('');
    
    // Store cancel function to handle unmount/cancellation if needed
    // For now we just run it
    try {
      // Wrap in promise to await completion
      await new Promise<void>((resolve, reject) => {
        // @ts-ignore
        const _cancel = api.updateRanking(
          boardIdentity.board,
          boardIdentity.part,
          boardIdentity.issue,
          false,
          {
            onProgress: (data) => setBoardProgress(data),
            onComplete: () => {
              setBoardUpdateStatus('success');
              setBoardUpdateError('');
              resolve();
            },
            onError: (err) => {
               // Only reject if it's a real error
               // For SSE sometimes error event fires on close, handled inside api wrapper but good to be safe
               // The api wrapper calls onError for non-closed state
               setBoardUpdateStatus('failed');
               // err is Event, try to get message or stringify
               setBoardUpdateError('Connection error or closed prematurely');
               reject(err);
            }
          }
        );
      });
    } catch (err: any) {
      // Error handled in callbacks mostly, but catch synchronous errors here
      if (boardUpdateStatus !== 'success') {
         setBoardUpdateStatus('failed');
         setBoardUpdateError(err?.message || '更新失败');
      }
    } finally {
      setBoardUpdating(false);
    }
  };

  const handleDataProcess = async (identity: DataIdentity) => {
    // setDataProcessing(true);
    setDataStatus('processing');
    try {
      await api.updateSnapshot(identity.date.toFormat('yyyy-MM-dd'));
      setDataStatus('success');
      setDataError('');
    } catch (err: any) {
      setDataStatus('failed');
      setDataError(err?.response?.data?.message || err.message || '处理失败');
    } finally {
      // setDataProcessing(false);
    }
  };

  const closeBoardDialog = () => {
    setBoardDialogOpen(false);
    setBoardIdentity(null);
  };

  const closeDataDialog = () => {
    setDataDialogOpen(false);
    setDataIdentity(null);
  };


  return (
    <div className="flex flex-col items-center p-8 w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">在线更新数据库</h1>
        <div className="text-muted-foreground">非相关人员勿动</div>
      </div>

      <UploadFile onComplete={handleUploadComplete} />

      {/* Board Processing Dialog */}
      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>排名文件处理</DialogTitle>
            <DialogDescription>
              确认文件信息并执行检查更新
            </DialogDescription>
          </DialogHeader>
          
          {boardIdentity && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md text-sm space-y-1">
                <div className="font-semibold mb-2">文件信息：</div>
                <div className="flex justify-between"><span>刊物：</span><span>{boards[boardIdentity.board]}</span></div>
                <div className="flex justify-between"><span>榜单：</span><span>{parts[boardIdentity.part]}</span></div>
                <div className="flex justify-between"><span>期数：</span><span>{boardIdentity.issue}</span></div>
              </div>

              {/* Check Status */}
              {boardCheckStatus && (
                <div className={cn("p-3 rounded-md flex items-center gap-2", 
                  boardCheckStatus === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                )}>
                  {boardCheckStatus === 'success' ? <CheckCircle2 className="h-5 w-5"/> : <XCircle className="h-5 w-5"/>}
                  <div className="flex-1">
                    {boardCheckStatus === 'success' ? "文件检查通过" : `文件检查失败：${boardCheckError}`}
                  </div>
                </div>
              )}
               {boardChecking && <div className="text-blue-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> 检查中...</div>}


              {/* Update Status */}
              {boardUpdateStatus && (
                <div className="space-y-2">
                   <div className={cn("p-3 rounded-md flex items-start gap-2",
                      boardUpdateStatus === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                      boardUpdateStatus === 'failed' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                   )}>
                      {boardUpdateStatus === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5"/> :
                       boardUpdateStatus === 'failed' ? <XCircle className="h-5 w-5 mt-0.5"/> :
                       <Loader2 className="h-5 w-5 animate-spin mt-0.5"/>
                      }
                      <div className="flex-1 text-sm">
                        {boardUpdateStatus === 'success' && "数据更新成功"}
                        {boardUpdateStatus === 'failed' && `数据更新失败：${boardUpdateError}`}
                        {boardUpdateStatus === 'updating' && "更新中..."}
                      </div>
                   </div>
                   {boardUpdateStatus === 'updating' && boardProgress && (
                      <div className="text-xs font-mono bg-muted p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {boardProgress}
                      </div>
                   )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="secondary" onClick={closeBoardDialog}>
              {boardUpdateStatus === 'success' ? '关闭' : '取消'}
            </Button>
            
            {!boardCheckStatus && (
               <Button onClick={handleBoardCheck} disabled={boardChecking}>
                 {boardChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 检查文件
               </Button>
            )}

            {boardCheckStatus === 'success' && boardUpdateStatus !== 'success' && (
              <Button onClick={handleBoardUpdate} disabled={boardUpdating}>
                 {boardUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 确定更新
              </Button>
            )}
             
            {boardUpdateStatus === 'success' && (
               <Button variant="default" onClick={closeBoardDialog} className="bg-green-600 hover:bg-green-700">
                 完成
               </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Data Processing Dialog */}
       <Dialog open={dataDialogOpen} onOpenChange={setDataDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>数据文件处理</DialogTitle>
             <DialogDescription>
              自动处理数据快照更新
            </DialogDescription>
          </DialogHeader>

          {dataIdentity && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md text-sm">
                 <span className="font-semibold">日期：</span>
                 {dataIdentity.date.toFormat('yyyy-MM-dd')}
              </div>

               <div className={cn("p-3 rounded-md flex items-center gap-2",
                  dataStatus === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                  dataStatus === 'failed' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                  "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
               )}>
                  {dataStatus === 'success' ? <CheckCircle2 className="h-5 w-5"/> :
                   dataStatus === 'failed' ? <XCircle className="h-5 w-5"/> :
                   <Loader2 className="h-5 w-5 animate-spin"/>
                  }
                  <div className="flex-1 text-sm">
                    {dataStatus === 'success' && "数据文件处理成功"}
                    {dataStatus === 'failed' && `数据文件处理失败：${dataError}`}
                    {dataStatus === 'processing' && "处理中..."}
                  </div>
               </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeDataDialog} disabled={dataStatus === 'processing'}>
              {dataStatus === 'success' ? '完成' : '关闭'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
