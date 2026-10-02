namespace Warehouse.Application.Exceptions;

public class InsufficientStockException : Exception
{
    public int AvailableQuantity { get; }
    public int RequestedQuantity { get; }
    public string MaterialCode { get; }
    public string LocationCode { get; }

    public InsufficientStockException(string materialCode, string locationCode, int available, int requested)
        : base($"Không đủ tồn kho cho vật tư '{materialCode}' tại vị trí '{locationCode}'. Tồn hiện tại: {available}, Số lượng yêu cầu: {requested}.")
    {
        MaterialCode = materialCode;
        LocationCode = locationCode;
        AvailableQuantity = available;
        RequestedQuantity = requested;
    }
}
