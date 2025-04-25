#include <iostream>

using namespace std;

int main()
{
	float su;
	int n, imsi;

	cout << "실수 입력 : ";
	cin >> su;
	cout << "반올림 자릿수 입력 : ";
	cin >> n;

	for (int i = 0;i < n; i++)
	{
		su = su * 10;
	}

	su = su + 5;
	imsi = (int)su / 10;
	su = (float)imsi;

	for(int i = 0;i < n - 1;i++)
	{
		su = su / 10;
	}

	cout << "반올림 결괏값 : " << su << endl;
}