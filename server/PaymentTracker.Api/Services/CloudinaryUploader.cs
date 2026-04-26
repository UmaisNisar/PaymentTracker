using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using PaymentTracker.Api.Options;

namespace PaymentTracker.Api.Services;

public class CloudinaryUploader
{
    private readonly Cloudinary _cloudinary;
    private readonly string _folder;

    public CloudinaryUploader(IOptions<CloudinaryOptions> options)
    {
        var o = options.Value;
        if (string.IsNullOrWhiteSpace(o.CloudName) || string.IsNullOrWhiteSpace(o.ApiKey) || string.IsNullOrWhiteSpace(o.ApiSecret))
            throw new InvalidOperationException("Cloudinary credentials are not configured.");

        _cloudinary = new Cloudinary(new Account(o.CloudName, o.ApiKey, o.ApiSecret));
        _folder = string.IsNullOrWhiteSpace(o.Folder) ? "payment-tracker" : o.Folder;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string publicId, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            PublicId = $"{_folder}/{publicId}",
            Overwrite = true,
            UseFilename = false,
            UniqueFilename = false
        };

        var result = await _cloudinary.UploadAsync(uploadParams, ct);
        if (result.Error is not null)
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

        return result.SecureUrl?.ToString() ?? throw new InvalidOperationException("Cloudinary did not return a URL.");
    }
}
