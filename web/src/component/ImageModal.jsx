import React, { useState, useEffect } from 'react';
import { colors } from '@assets/colors';

const ImageModal = ({ isOpen, onClose, images, signalementId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setLoading(true);
      setImageError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[currentIndex] : null;

  const handlePrevious = () => {
    setLoading(true);
    setImageError(false);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setLoading(true);
    setImageError(false);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasImages) handlePrevious();
    if (e.key === 'ArrowRight' && hasImages) handleNext();
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = `http://localhost:3000${currentImage.url}`;
    link.download = currentImage.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    },
    container: {
      position: 'relative',
      width: '100%',
      maxWidth: '1000px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: colors.surface,
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${colors.border}`
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: `1px solid ${colors.border}`,
      backgroundColor: colors.surface
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      backgroundColor: `${colors.primary}20`,
      borderRadius: '10px'
    },
    title: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '600',
      color: colors.text
    },
    subtitle: {
      margin: 0,
      fontSize: '13px',
      color: colors.tertiary
    },
    closeBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      backgroundColor: 'transparent',
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
      color: colors.tertiary,
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    imageContainer: {
      position: 'relative',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      minHeight: '400px',
      backgroundColor: '#F8FAFC'
    },
    image: {
      maxWidth: '100%',
      maxHeight: '60vh',
      objectFit: 'contain',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    },
    loader: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      color: colors.tertiary
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: `3px solid ${colors.border}`,
      borderTopColor: colors.primary,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    navBtn: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      backgroundColor: `${colors.surface}90`,
      border: `1px solid ${colors.border}`,
      borderRadius: '50%',
      color: colors.text,
      cursor: 'pointer',
      transition: 'all 0.2s',
      zIndex: 10
    },
    navBtnPrev: {
      left: '16px'
    },
    navBtnNext: {
      right: '16px'
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderTop: `1px solid ${colors.border}`,
      backgroundColor: colors.surface
    },
    imageInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    imageName: {
      margin: 0,
      fontSize: '14px',
      fontWeight: '500',
      color: colors.text,
      maxWidth: '300px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    imageDate: {
      margin: 0,
      fontSize: '12px',
      color: colors.tertiary
    },
    footerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    counter: {
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: '500',
      color: colors.tertiary,
      backgroundColor: `${colors.secondary}20`,
      borderRadius: '20px'
    },
    downloadBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      color: colors.surface,
      backgroundColor: colors.primary,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      gap: '16px'
    },
    emptyIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '80px',
      height: '80px',
      backgroundColor: `${colors.primary}10`,
      borderRadius: '50%'
    },
    emptyText: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '500',
      color: colors.text
    },
    emptySubtext: {
      margin: 0,
      fontSize: '14px',
      color: colors.tertiary
    },
    errorState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      color: colors.tertiary
    },
    thumbnails: {
      display: 'flex',
      gap: '8px',
      padding: '12px 24px',
      overflowX: 'auto',
      backgroundColor: '#F8FAFC',
      borderTop: `1px solid ${colors.border}`
    },
    thumbnail: {
      width: '60px',
      height: '60px',
      objectFit: 'cover',
      borderRadius: '8px',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.2s',
      opacity: 0.6
    },
    thumbnailActive: {
      border: `2px solid ${colors.primary}`,
      opacity: 1
    }
  };

  return (
    <div 
      style={styles.overlay} 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <div style={styles.headerIcon}>
              <i className="fas fa-images" style={{ fontSize: '20px', color: colors.primary }}></i>
            </div>
            <div>
              <h3 style={styles.title}>Images du signalement</h3>
              <p style={styles.subtitle}>
                {hasImages ? `${images.length} image${images.length > 1 ? 's' : ''} associée${images.length > 1 ? 's' : ''}` : 'Aucune image'}
              </p>
            </div>
          </div>
          <button 
            style={styles.closeBtn} 
            onClick={onClose}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `${colors.secondary}30`;
              e.target.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = colors.tertiary;
            }}
          >
            <i className="fas fa-times" style={{ fontSize: '20px' }}></i>
          </button>
        </div>

        {/* Content */}
        {!hasImages ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <i className="fas fa-images" style={{ fontSize: '40px', color: colors.primary }}></i>
            </div>
            <p style={styles.emptyText}>Aucune image disponible</p>
            <p style={styles.emptySubtext}>
              Les images seront disponibles après synchronisation
            </p>
          </div>
        ) : (
          <>
            {/* Image Display */}
            <div style={styles.imageContainer}>
              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <button
                    style={{ ...styles.navBtn, ...styles.navBtnPrev }}
                    onClick={handlePrevious}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.primary;
                      e.target.style.color = colors.surface;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = `${colors.surface}90`;
                      e.target.style.color = colors.text;
                    }}
                  >
                    <i className="fas fa-chevron-left" style={{ fontSize: '24px' }}></i>
                  </button>
                  <button
                    style={{ ...styles.navBtn, ...styles.navBtnNext }}
                    onClick={handleNext}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.primary;
                      e.target.style.color = colors.surface;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = `${colors.surface}90`;
                      e.target.style.color = colors.text;
                    }}
                  >
                    <i className="fas fa-chevron-right" style={{ fontSize: '24px' }}></i>
                  </button>
                </>
              )}

              {/* Image or Loader */}
              {loading && !imageError && (
                <div style={styles.loader}>
                  <div style={styles.spinner}></div>
                  <span>Chargement...</span>
                </div>
              )}
              
              {imageError ? (
                <div style={styles.errorState}>
                  <i className="fas fa-image" style={{ fontSize: '48px' }}></i>
                  <span>Impossible de charger l'image</span>
                </div>
              ) : (
                <img
                  src={`http://localhost:3000${currentImage.url}`}
                  alt={currentImage.name}
                  style={{
                    ...styles.image,
                    display: loading ? 'none' : 'block'
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={styles.thumbnails}>
                {images.map((img, index) => (
                  <img
                    key={img.id}
                    src={`http://localhost:3000${img.url}`}
                    alt={img.name}
                    style={{
                      ...styles.thumbnail,
                      ...(index === currentIndex ? styles.thumbnailActive : {})
                    }}
                    onClick={() => {
                      setCurrentIndex(index);
                      setLoading(true);
                      setImageError(false);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={styles.footer}>
              <div style={styles.imageInfo}>
                <p style={styles.imageName}>{currentImage.name}</p>
                <p style={styles.imageDate}>
                  Uploadée le {formatDate(currentImage.date_upload)}
                </p>
              </div>
              <div style={styles.footerActions}>
                <span style={styles.counter}>
                  {currentIndex + 1} / {images.length}
                </span>
                <button
                  style={styles.downloadBtn}
                  onClick={handleDownload}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '0.9';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fas fa-download" style={{ fontSize: '16px' }}></i>
                  Télécharger
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
