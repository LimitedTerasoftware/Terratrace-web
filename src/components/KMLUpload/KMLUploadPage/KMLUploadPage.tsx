import React, { useState } from 'react';
import KMLUploadHeader from './KMLUploadHeader';
import FileUploadManager from '../FileUpload/FileUploadManager';
import KMLMetadata from './KMLMetadata';
import KMLVisualizer from './KMLVisualizer';
import KMLHelpCard from './KMLHelpCard';

const KMLUploadPage: React.FC = () => {
    const [hasUploadedFile, setHasUploadedFile] = useState(false);

    const handleUploadComplete = (file: File) => {
        console.log('Upload complete:', file);
        setHasUploadedFile(true);
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <KMLUploadHeader />

                <div className="grid grid-cols-1 gap-8">
                    {/* Main upload area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload KML File</h2>
                            <FileUploadManager
                                onUploadComplete={handleUploadComplete}
                                
                            />
                        </div>

                        <KMLVisualizer showPlaceholder={!hasUploadedFile} />
                    </div>

                    {/* Sidebar */}
                    <div className="md:col-span-1 space-y-6">
                        <KMLMetadata showPlaceholder={!hasUploadedFile} />
                        <KMLHelpCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KMLUploadPage;