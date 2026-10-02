using Warehouse.Domain.Common;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Domain.Entities;

public class Inventory : BaseEntity
{
    public int MaterialId { get; set; }
    public Material Material { get; set; } = null!;

    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;

    public int Quantity { get; set; } = 0;

    // Optimistic Concurrency Control Token
    public byte[]? RowVersion { get; set; }

    public void IncreaseStock(int amount)
    {
        if (amount <= 0)
            throw new DomainException("Số lượng nhập phải lớn hơn 0.");

        Quantity += amount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DecreaseStock(int amount)
    {
        if (amount <= 0)
            throw new DomainException("Số lượng xuất phải lớn hơn 0.");

        if (Quantity < amount)
            throw new DomainException($"Không đủ tồn kho. Tồn hiện tại: {Quantity}, Số lượng yêu cầu: {amount}.");

        Quantity -= amount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AdjustStock(int targetQuantity)
    {
        if (targetQuantity < 0)
            throw new DomainException("Số lượng tồn kho sau điều chỉnh không thể là số âm.");

        Quantity = targetQuantity;
        UpdatedAt = DateTime.UtcNow;
    }
}
