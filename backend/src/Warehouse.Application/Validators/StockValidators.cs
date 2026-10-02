using FluentValidation;
using Warehouse.Application.DTOs.Stock;

namespace Warehouse.Application.Validators;

public class StockInRequestValidator : AbstractValidator<StockInRequest>
{
    public StockInRequestValidator()
    {
        RuleFor(x => x.MaterialCode)
            .NotEmpty().WithMessage("Mã vật tư không được để trống.");

        RuleFor(x => x.LocationCode)
            .NotEmpty().WithMessage("Mã vị trí kho không được để trống.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng nhập kho phải lớn hơn 0.");
    }
}

public class StockOutRequestValidator : AbstractValidator<StockOutRequest>
{
    public StockOutRequestValidator()
    {
        RuleFor(x => x.MaterialCode)
            .NotEmpty().WithMessage("Mã vật tư không được để trống.");

        RuleFor(x => x.LocationCode)
            .NotEmpty().WithMessage("Mã vị trí kho không được để trống.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng xuất kho phải lớn hơn 0.");
    }
}

public class StockAdjustRequestValidator : AbstractValidator<StockAdjustRequest>
{
    public StockAdjustRequestValidator()
    {
        RuleFor(x => x.MaterialCode)
            .NotEmpty().WithMessage("Mã vật tư không được để trống.");

        RuleFor(x => x.LocationCode)
            .NotEmpty().WithMessage("Mã vị trí kho không được để trống.");

        RuleFor(x => x.ActualQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Số lượng kiểm kê thực tế phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Lý do điều chỉnh tồn kho là bắt buộc để lưu vết kiểm toán (Audit Trail).")
            .MinimumLength(5).WithMessage("Lý do điều chỉnh phải có ít nhất 5 ký tự.");
    }
}

public class StockTransferRequestValidator : AbstractValidator<StockTransferRequest>
{
    public StockTransferRequestValidator()
    {
        RuleFor(x => x.MaterialCode)
            .NotEmpty().WithMessage("Mã vật tư không được để trống.");

        RuleFor(x => x.SourceLocationCode)
            .NotEmpty().WithMessage("Vị trí nguồn không được để trống.");

        RuleFor(x => x.DestinationLocationCode)
            .NotEmpty().WithMessage("Vị trí đích không được để trống.")
            .NotEqual(x => x.SourceLocationCode).WithMessage("Vị trí đích không được trùng với vị trí nguồn.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng chuyển vị trí phải lớn hơn 0.");
    }
}
