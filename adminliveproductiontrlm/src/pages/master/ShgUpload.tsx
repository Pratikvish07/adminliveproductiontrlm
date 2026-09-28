import React from 'react';
import { UploadCloud, FileSpreadsheet, X, AlertTriangle } from 'lucide-react';
import { crpService } from '../../services/crpService';
import './MasterData.css';
import './Activity.css';
import './ShgUpload.css';

const ACCEPTED_EXTENSIONS = '.xlsx,.xls,.csv';

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ShgUploadPage: React.FC = () => {
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [successMsg, setSuccessMsg] = React.useState('');

    const flashSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 5000);
    };

    const pickFile = (file: File | null) => {
        setError('');
        setSelectedFile(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        pickFile(e.target.files?.[0] ?? null);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        pickFile(e.dataTransfer.files?.[0] ?? null);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please choose a file to upload.');
            return;
        }
        try {
            setUploading(true);
            setError('');
            const response = await crpService.uploadSHGFile(selectedFile);
            flashSuccess(response?.message || `"${selectedFile.name}" uploaded successfully.`);
            handleRemoveFile();
        } catch {
            setError('Failed to upload SHG file. Please check the file format and try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="master-page activity-page">
            <div className="master-header activity-header-row">
                <div>
                    <p className="master-kicker">Master Data</p>
                    <h1 className="master-title">SHG Upload</h1>
                    <p className="master-subtitle">Bulk-upload the SHG master file used across the app.</p>
                </div>
            </div>

            <div className="shg-upload-notice">
                <AlertTriangle size={18} />
                <span>
                    This upload updates SHG data for the entire application. Please verify the file
                    contents before uploading — existing SHG records referenced elsewhere (CRP, members,
                    livelihood) may be affected.
                </span>
            </div>

            {error && (
                <div className="master-alert">
                    {error}
                    <button className="act-alert-close" onClick={() => setError('')} type="button">
                        <X size={14} />
                    </button>
                </div>
            )}
            {successMsg && (
                <div className="act-success-banner">
                    {successMsg}
                </div>
            )}

            <div className="shg-upload-card">
                {selectedFile ? (
                    <div className="shg-upload-file-row">
                        <div className="shg-upload-file-info">
                            <FileSpreadsheet size={20} />
                            <span>{selectedFile.name}</span>
                        </div>
                        <span className="shg-upload-file-size">{formatFileSize(selectedFile.size)}</span>
                        <button
                            type="button"
                            className="shg-upload-file-remove"
                            title="Remove file"
                            onClick={handleRemoveFile}
                            disabled={uploading}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <label
                        className={`shg-upload-dropzone${isDragOver ? ' is-dragover' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <UploadCloud size={32} className="shg-upload-dropzone-icon" />
                        <p className="shg-upload-dropzone-title">Choose a file or drag it here</p>
                        <p className="shg-upload-dropzone-hint">Supported formats: XLSX, XLS, CSV</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_EXTENSIONS}
                            onChange={handleFileChange}
                        />
                    </label>
                )}

                <div className="shg-upload-actions">
                    <button
                        type="button"
                        className="act-btn-primary"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShgUploadPage;
