import React, { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import ActionButton from '../ActionButton/ActionButton';
import CommonModal from '../CommonModal/CommonModal';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
    isOpen: boolean;
    imageSrc: string | null;
    onCancel: () => void;
    onConfirm: (croppedDataUrl: string) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', error => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
};

const getCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas context is not available');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg', 0.92);
};

const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, imageSrc, onCancel, onConfirm }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!imageSrc || !croppedAreaPixels) {
            setError('Выберите область для кадрирования.');
            return;
        }
        setIsSaving(true);
        try {
            const croppedImage = await getCroppedImage(imageSrc, croppedAreaPixels);
            onConfirm(croppedImage);
        } catch (cropError) {
            console.error('Не удалось кадрировать изображение', cropError);
            setError('Не удалось кадрировать изображение.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <CommonModal
            isOpen={isOpen}
            onClose={onCancel}
            title="Кадрирование фотографии"
            minWidth={720}
            minHeight={520}
        >
            <div className={styles.cropBody}>
                {error && <div className={styles.cropError}>{error}</div>}
                <div className={styles.cropContainer}>
                    {imageSrc ? (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    ) : (
                        <div className={styles.cropPlaceholder}>Изображение не выбрано</div>
                    )}
                </div>
                <div className={styles.cropControls}>
                    <label className={styles.zoomLabel}>
                        Масштаб
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(event) => setZoom(Number(event.target.value))}
                            className={styles.zoomRange}
                        />
                    </label>
                </div>
                <div className={styles.cropActions}>
                    <ActionButton
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Отмена
                    </ActionButton>
                    <ActionButton
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleConfirm}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Сохраняем…' : 'Применить'}
                    </ActionButton>
                </div>
            </div>
        </CommonModal>
    );
};

export default ImageCropModal;
