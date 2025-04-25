#include <iostream>

using namespace std;

int main()
{
    int kor, math, eng, sum;
    float average;

    kor = 100;
    math = 98;
    eng = 79;

    sum = kor + math + eng;
    average = sum / 3;

    cout << "총점 : " << sum << endl;
    cout << "평균 : " << average << endl;
}