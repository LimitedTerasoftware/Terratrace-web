import { MapPin } from "lucide-react";
import React from "react";

interface KMLUploadHeaderProps {
    title?:string;
    subtitle?:string;
}
const KMLUploadHeader:React.FC<KMLUploadHeaderProps>=({
 title="KML File Upload",
 subtitle="Upload and process Keyhole Markup Language (KML) files",
})=>{
    return (
    <header className="mb-8 text-center md:text-left">
        <div className="flex gap-3 items-center mb-2">
            <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-lg mb-4">
                <MapPin className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      </div>
      <p className="text-gray-600 max-w-2xl">{subtitle}</p>
    </header>
  );
}
export default KMLUploadHeader