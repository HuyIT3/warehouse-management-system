using FluentValidation;
using Warehouse.Application.DTOs.Materials;

namespace Warehouse.Application.Validators;

public class CreateMaterialRequestValidator : AbstractValidator<CreateMaterialRequest>
{
    public CreateMaterialRequestValidator()
    {
        RuleFor(x => x.MaterialCode)
            .NotEmpty().WithMessage("Mã vật tư không được để trống.")
            .MaximumLength(50).WithMessage("Mã vật tư không được vượt quá 50 ký tự.")
            .Matches(@"^[a-zA-Z0-9\-_]+$").WithMessage("Mã vật tư chỉ được chứa chữ cái, chữ số, dấu gạch ngang và gạch dưới.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên vật tư không được để trống.")
            .MaximumLength(200).WithMessage("Tên vật tư không được vượt quá 200 ký tự.");

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Đơn vị tính không được để trống.")
            .MaximumLength(30).WithMessage("Đơn vị tính không được vượt quá 30 ký tự.");

        RuleFor(x => x.MinStock)
            .GreaterThanOrEqualTo(0).WithMessage("Định mức tồn tối thiểu phải lớn hơn hoặc bằng 0.");
    }
}

public class UpdateMaterialRequestValidator : AbstractValidator<UpdateMaterialRequest>
{
    public UpdateMaterialRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên vật tư không được để trống.")
            .MaximumLength(200).WithMessage("Tên vật tư không được vượt quá 200 ký tự.");

        RuleFor(x => x.Unit)
            .NotEmpty().WithMessage("Đơn vị tính không được để trống.")
            .MaximumLength(30).WithMessage("Đơn vị tính không được vượt quá 30 ký tự.");

        RuleFor(x => x.MinStock)
            .GreaterThanOrEqualTo(0).WithMessage("Định mức tồn tối thiểu phải lớn hơn hoặc bằng 0.");
    }
}
