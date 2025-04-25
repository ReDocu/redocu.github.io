#include <iostream>

using namespace std;

int main()
{
	int num1, num2;
	int sum, sub, mul, div1;
	double div2;

	cout.setf(ios_base::fixed, ios_base::floatfield);
	cout << "정수 입력 : ";
	cin >> num1;

	cout << "정수 입력 : ";
	cin >> num2;

	sum = num1 + num2;
	sub = num1 - num2;
	mul = num1 * num2;
	div1 = num1 / num2;
	div2 = num1 / num2;

	cout << "덧셈 결과 : " << sum << endl;
	cout << "뺏셈 결과 : " << sub << endl;
	cout << "곱셈 결과 : " << mul << endl;
	cout << "나눗셈(int) 결과" << div1 << endl;
	cout << "나눗셈(double) 결과" << div2 << endl;
	div2 = num1 / (double)num2;
	cout << "나눗셈(double) 결과" << div2 << endl;
}