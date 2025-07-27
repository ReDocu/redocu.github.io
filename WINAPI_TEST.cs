Vector2 mousePos = Input.mousePosition;
mousePos = mainCamera.ScreenToWorldPoint(mousePos);

Vector3 playerPos = transform.position;
    
Vector2 distanceVec = mousePos - (Vector2)playerPos;


//
distanceVec = distanceVec.normalized;

GameObject tempObject = Instantiate(bulletObject, bulletContainer);
tempObject.transform.right = distanceVec;

tempObject.transform.position = (Vector2)playerPos + distanceVec * 0.5f;

transform.Translate(-distanceVec);

//
guideLine.SetActive(distanceVec.magnitude < ditectionRange ? true : false);
// magnitude 거리
// sqrMagnitude 거리의 제곱

guideLine.transform.right = distanceVec.normalized;

//
int i = 0;
foreach (var ghost in ghostObjectArray)
{
    Vector3 distanceVec = ghost.transform.position - transform.position;
    if (distanceVec.magnitude < rangeDistance)
    {
        Vector3 dirVec = distanceVec.normalized;
        
        if(Vector3.Dot(transform.up, dirVec) > Mathf.Cos(rangeAngle*Mathf.Deg2Rad))
            i++;
    }
}

Vector3 distVec = transform.position - _col.transform.position;
if (Vector3.Cross(_col.transform.right, distVec).z > 0)
{
    Debug.Log("Up");
    return;
}
Debug.Log("Down");

//
Quaternion rot = Quaternion.Euler(45, 0, 45);
Vector3 tran = new Vector3(2, 1, 5);
Vector3 scal = new Vector3(10, 10, 10);
worldMat = Matrix4x4.TRS(tran, rot, scal);
//worldMat = Matrix4x4.Translate(new Vector3(2, 1, 5)) * Matrix4x4.Rotate(rot) * Matrix4x4.Scale(new Vector3(10,10,10));

for (int i = 0; i < 4; i++)
{
    Debug.Log(worldMat.GetColumn(i));
}

//
Matrix4x4 matrix = transform.localToWorldMatrix;
Debug.Log("=== Matrix ===");
for (int i = 0; i < 4; i++)
{
    Debug.Log(matrix.GetColumn(i));
}

Vector3 position = matrix.GetColumn(3);
Debug.Log("=== Position ===");
Debug.Log(position);

Quaternion rotation = Quaternion.LookRotation(
    matrix.GetColumn(2),
    matrix.GetColumn(1)
);

Debug.Log("=== Rotation ===");
Debug.Log(rotation.eulerAngles);

Debug.Log("=== Scale ===");
Vector3 scale = new Vector3(
    matrix.GetColumn(0).magnitude,
    matrix.GetColumn(1).magnitude,
    matrix.GetColumn(2).magnitude
);
Debug.Log(scale);

//

boxRigidbody.AddForce(transform.right * movePower, ForceMode.Impulse);
boxRigidbody.AddForce(transform.right * movePower, ForceMode.Force);
boxRigidbody.AddForce(transform.right * movePower, ForceMode.VelocityChange);
boxRigidbody.AddForce(transform.right * movePower, ForceMode.Acceleration);

//
Debug.Log("=== Simulation ===");

isGround = false;
transform.right = new Vector2(Mathf.Cos(shotAngle * Mathf.Deg2Rad), Mathf.Sin(shotAngle * Mathf.Deg2Rad));
ballRB2D.velocity = transform.right * shotVelocity;

totalTime = 0f;
while (true)
{
    yield return null;
    if (isGround) break;
    totalTime += Time.deltaTime;
    if (Mathf.Abs(ballRB2D.velocity.y) < 0.1f && !isCenter)
    {
        isCenter = true;
        Debug.Log("CenterHeight: " + transform.position.y);
    }
}

//

float totalTime = 2 * shotVelocity * Mathf.Sin(shotAngle * Mathf.Deg2Rad) / 9.81f;
float centerHeight = Mathf.Pow(shotVelocity * Mathf.Sin(shotAngle * Mathf.Deg2Rad), 2) / (2*9.81f); // (V*sin(theta))^2 / 2g
float totalMeter = Mathf.Pow(shotVelocity,2) / 9.81f * Mathf.Sin(2 * shotAngle * Mathf.Deg2Rad); // v^2/g*sin(2*theta)

Debug.Log("Totaltime: " + totalTime);
Debug.Log("CenterHeight: " + centerHeight);
Debug.Log("TotalMeter: " + totalMeter);

//

public PhysicsMaterial2D slopeMaterial;
private Rigidbody2D boxRigidbody2D;
private float boxMass = 0f;
private float gravity = 0f;
private float friction = 0f;
private float angle = 0f;
///

boxRigidbody2D = GetComponent<Rigidbody2D>();
boxMass = boxRigidbody2D.mass;
gravity = 9.8f * boxRigidbody2D.gravityScale;
friction = slopeMaterial.friction;
angle = transform.rotation.eulerAngles.z;

float pushForce = boxMass * gravity * Mathf.Sin(angle * Mathf.Deg2Rad);
float frictionForce = friction * boxMass * gravity * Mathf.Cos(angle * Mathf.Deg2Rad);

Debug.Log("Push: " + pushForce + " , Friction: " + frictionForce);

if (pushForce > frictionForce)
    Debug.Log("움직임");
else
    Debug.Log("정지");

//

rotationRB2D.AddForce(transform.right * movePower, ForceMode2D.Impulse);
rotationRB2D.AddTorque(movePower, ForceMode2D.Impulse);

ballRB2D.velocity = transform.right * moveVelocity;