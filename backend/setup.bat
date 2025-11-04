@echo off
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Creating migrations...
python manage.py makemigrations

echo.
echo Running migrations...
python manage.py migrate

echo.
echo Creating test data...
python manage.py create_test_data

echo.
echo Setup complete!
echo.
echo You can now run: python manage.py runserver
echo Login with: demo / demo123
