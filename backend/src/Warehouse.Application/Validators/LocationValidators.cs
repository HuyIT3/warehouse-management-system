using FluentValidation;
using Warehouse.Application.DTOs.Locations;

namespace Warehouse.Application.Validators;

public class CreateLocationRequestValidator : AbstractValidator<CreateLocationRequest>
{
    public CreateLocationRequestValidator()
    {
        RuleFor(x => x.LocationCode)
            .NotEmpty().WithMessage("Mã vị trí không được để trống.")
            .MaximumLength(50).WithMessage("Mã vị trí không được vượt quá 50 ký tự.");

        RuleFor(x => x.Rack)
            .NotEmpty().WithMessage("Tên kệ (Rack) không được để trống.")
            .MaximumLength(20).WithMessage("Tên kệ không được vượt quá 20 ký tự.");

        RuleFor(x => x.Level)
            .GreaterThan(0).WithMessage("Tầng (Level) phải lớn hơn 0.");

        RuleFor(x => x.Slot)
            .NotEmpty().WithMessage("Ô (Slot) không được để trống.")
            .MaximumLength(20).WithMessage("Ô không được vượt quá 20 ký tự.");
    }
}

public class UpdateLocationRequestValidator : AbstractValidator<UpdateLocationRequest>
{
    public UpdateLocationRequestValidator()
    {
        RuleFor(x => x.Rack)
            .NotEmpty().WithMessage("Tên kệ (Rack) không được để trống.")
            .MaximumLength(20).WithMessage("Tên kệ không được vượt quá 20 ký tự.");

        RuleFor(x => x.Level)
            .GreaterThan(0).WithMessage("Tầng (Level) phải lớn hơn 0.");

        RuleFor(x => x.Slot)
            .NotEmpty().WithMessage("Ô (Slot) không được để trống.")
            .MaximumLength(20).WithMessage("Ô không được vượt quá 20 ký tự.");
    }
}
