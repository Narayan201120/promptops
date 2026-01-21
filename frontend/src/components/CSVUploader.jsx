import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import styles from './CSVUploader.module.css';
import Papa from 'papaparse';

export default function CSVUploader({ onUpload, isUploading }) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const inputRef = useRef(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const processFile = (file) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please upload a CSV file');
            return;
        }

        setFile(file);

        // Parse preview
        Papa.parse(file, {
            header: true,
            preview: 5, // Just get first 5 rows for validation/preview
            complete: (results) => {
                setPreview({
                    rowCount: results.meta.cursor || 'Unknown', // Approximate or need full parse for exact
                    columns: results.meta.fields || []
                });
            }
        });
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleConfirm = () => {
        if (file) {
            onUpload(file);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`${styles.uploader} ${isDragging ? styles.uploaderActive : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv"
                            className={styles.hiddenInput}
                            onChange={handleChange}
                        />
                        <div className={styles.content}>
                            <div className={styles.iconWrapper}>
                                <Upload size={32} className={isDragging ? 'text-white' : 'text-cyan-400'} />
                            </div>
                            <div>
                                <h3 className={styles.title}>
                                    {isDragging ? 'Drop CSV here' : 'Upload Dataset'}
                                </h3>
                                <p className={styles.subtitle}>
                                    Drag & drop your CSV file here, or click to browse
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={styles.preview}
                    >
                        <div className={styles.fileIcon}>
                            <FileText size={24} />
                        </div>
                        <div className={styles.fileInfo}>
                            <div className={styles.fileName}>{file.name}</div>
                            <div className={styles.fileMeta}>
                                {(file.size / 1024).toFixed(1)} KB • {preview?.columns.length || 0} columns
                            </div>
                            {isUploading && (
                                <div className={styles.progressBar}>
                                    <motion.div
                                        className={styles.progressFill}
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1.5 }}
                                    />
                                </div>
                            )}
                        </div>
                        {!isUploading && (
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                    className={styles.removeBtn}
                                >
                                    <X size={20} />
                                </button>
                                <Button
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                                    icon={Check}
                                >
                                    Upload
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
