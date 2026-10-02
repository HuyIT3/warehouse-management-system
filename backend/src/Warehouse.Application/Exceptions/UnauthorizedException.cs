namespace Warehouse.Application.Exceptions;

public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message = "Bạn không có quyền thực hiện hành động này hoặc thông tin đăng nhập không hợp lệ.")
        : base(message)
    {
    }
}
