using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Backend.Services
{
    public interface IFileValidationService
    {
        (bool IsValid, string ErrorMessage) ValidateFile(IFormFile file, string allowedExtensions, int maxFileSizeBytes);
    }

    public class FileValidationService : IFileValidationService
    {
        // Dictionary containing file signatures (magic bytes) for common file types
        private static readonly Dictionary<string, List<byte[]>> FileSignatures = new Dictionary<string, List<byte[]>>
        {
            { ".pdf", new List<byte[]> { new byte[] { 0x25, 0x50, 0x44, 0x46 } } },
            { ".jpeg", new List<byte[]> { new byte[] { 0xFF, 0xD8, 0xFF } } },
            { ".jpg", new List<byte[]> { new byte[] { 0xFF, 0xD8, 0xFF } } },
            { ".png", new List<byte[]> { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } } },
            { ".zip", new List<byte[]> 
                { 
                    new byte[] { 0x50, 0x4B, 0x03, 0x04 }, 
                    new byte[] { 0x50, 0x4B, 0x4C, 0x49, 0x54, 0x45 }, 
                    new byte[] { 0x50, 0x4B, 0x53, 0x70, 0x58 }, 
                    new byte[] { 0x50, 0x4B, 0x05, 0x06 }, 
                    new byte[] { 0x50, 0x4B, 0x07, 0x08 } 
                } 
            },
            // DOCX, XLSX, PPTX are essentially ZIP files containing XML
            { ".docx", new List<byte[]> { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } },
            { ".xlsx", new List<byte[]> { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } },
            { ".pptx", new List<byte[]> { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } },
            // Old Office formats (DOC, XLS, PPT)
            { ".doc", new List<byte[]> { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } } },
            { ".xls", new List<byte[]> { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } } },
            { ".ppt", new List<byte[]> { new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 } } },
            { ".rar", new List<byte[]> { new byte[] { 0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00 }, new byte[] { 0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00 } } },
            { ".txt", new List<byte[]> { } } // TXT files don't have a specific magic number, usually handled by plain text encoding checks, but we'll bypass magic number check for .txt if allowed
        };

        public (bool IsValid, string ErrorMessage) ValidateFile(IFormFile file, string allowedExtensionsConfig, int maxFileSizeBytes)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "File trống hoặc không hợp lệ.");
            }

            // 1. Validate File Size
            if (file.Length > maxFileSizeBytes)
            {
                return (false, $"Dung lượng file vượt quá giới hạn cho phép ({(maxFileSizeBytes / 1024.0 / 1024.0):0.##} MB).");
            }

            // 2. Validate Extension (Whitelist from Config)
            // Example config: ".pdf,.docx,.xlsx,.jpg,.png"
            var allowedExts = allowedExtensionsConfig.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                                     .Select(e => e.Trim().ToLowerInvariant())
                                                     .ToList();
            
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext) || !allowedExts.Contains(ext))
            {
                return (false, $"Định dạng file '{ext}' không được phép tải lên. Các định dạng cho phép: {allowedExtensionsConfig}");
            }

            // 3. Validate Magic Numbers (File Signatures)
            if (FileSignatures.TryGetValue(ext, out var signatures) && signatures.Any())
            {
                using (var reader = new BinaryReader(file.OpenReadStream()))
                {
                    // Find the longest signature for this extension to know how many bytes to read
                    int maxSignatureLength = signatures.Max(s => s.Length);
                    byte[] headerBytes = reader.ReadBytes(maxSignatureLength);

                    bool isSignatureMatch = signatures.Any(signature => 
                        headerBytes.Take(signature.Length).SequenceEqual(signature)
                    );

                    if (!isSignatureMatch)
                    {
                        return (false, "Nội dung file không khớp với định dạng đuôi file (có dấu hiệu giả mạo file).");
                    }
                }
            }
            else if (ext != ".txt" && ext != ".csv") 
            {
                // If it's in the whitelist but we don't have a signature for it, and it's not a known text format
                // In a highly strict system, we might reject. Here we can either allow or log a warning.
                // We will allow it for flexibility, assuming the whitelist is controlled.
            }

            return (true, string.Empty);
        }
    }
}
