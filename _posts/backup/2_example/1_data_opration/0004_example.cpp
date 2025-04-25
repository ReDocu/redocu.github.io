#include <iostream>

using namespace std;

int main()
{
	int height, weight;
	float std_weight;

	cout << "키 입력 : ";
	cin >> height;

	cout << "몸무게 입력 : ";
	cin >> weight;

	std_weight = (height - 100) * 0.9f;

	cout << "표준 몸무게 : " << std_weight << endl;

	if (weight < (std_weight * 0.9f))
		cout << "저체중 입니다." << endl;
	else if (weight > (std_weight * 1.2f))
		cout << "과체중 입니다." << endl;
	else
		cout << "정상체중 입니다." << endl;
}