import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCalendarImport, CSVEvent, ValidationError } from '@/hooks/useCalendarImport';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface CalendarImportProps {
  onImport: (events: any[]) => Promise<void>;
}

export const CalendarImport = ({ onImport }: CalendarImportProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedEvents, setParsedEvents] = useState<CSVEvent[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isProcessing, generateTemplate, processFile, convertToCalendarFormat } = useCalendarImport();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV",
        variant: "destructive"
      });
      return;
    }

    const { events, errors } = await processFile(file);
    setParsedEvents(events);
    setErrors(errors);

    if (errors.length === 0 && events.length > 0) {
      toast({
        title: "Arquivo processado",
        description: `${events.length} evento(s) encontrado(s) e validado(s)`,
      });
    }
  };

  const handleImport = async () => {
    if (parsedEvents.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const convertedEvents = parsedEvents.map(convertToCalendarFormat);
      const total = convertedEvents.length;

      for (let i = 0; i < convertedEvents.length; i++) {
        await onImport([convertedEvents[i]]);
        setImportProgress(((i + 1) / total) * 100);
      }

      toast({
        title: "Importação concluída",
        description: `${convertedEvents.length} evento(s) importado(s) com sucesso`,
      });

      setParsedEvents([]);
      setErrors([]);
      setImportProgress(0);
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os eventos",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setParsedEvents([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar Calendário (CSV)
        </CardTitle>
        <CardDescription>
          Faça upload de um arquivo CSV com seus eventos ou baixe o template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateTemplate}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Template
          </Button>
        </div>

        {parsedEvents.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste seu arquivo CSV aqui ou clique para selecionar
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              Selecionar Arquivo
            </Button>
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Erros encontrados no arquivo:</p>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>
                    Linha {error.row}, campo "{error.field}": {error.message}
                  </li>
                ))}
                {errors.length > 10 && (
                  <li className="text-muted-foreground">
                    ... e mais {errors.length - 10} erro(s)
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {parsedEvents.length > 0 && errors.length === 0 && (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-semibold text-green-600">
                  {parsedEvents.length} evento(s) pronto(s) para importar
                </p>
                <div className="mt-2 max-h-40 overflow-y-auto text-sm space-y-1">
                  {parsedEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="text-muted-foreground">
                      • {event.title} - {event.date} às {event.start_time}
                    </div>
                  ))}
                  {parsedEvents.length > 5 && (
                    <div className="text-muted-foreground">
                      ... e mais {parsedEvents.length - 5} evento(s)
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Importando... {Math.round(importProgress)}%
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="flex-1"
              >
                Importar Eventos
              </Button>
              <Button
                variant="outline"
                onClick={resetImport}
                disabled={isImporting}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
