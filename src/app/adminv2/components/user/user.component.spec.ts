import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../shared/services/api/api.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { UserComponent } from './user.component';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';

describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let notifications: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getDatas',
      'addData',
      'updateData',
      'patchDataAtUrl',
      'deleteData',
    ]);
    api.getDatas.and.returnValue(of({ result: [] }));
    api.addData.and.returnValue(of({ status: 200 }));
    api.updateData.and.returnValue(of({ status: 200 }));
    api.patchDataAtUrl.and.returnValue(of({ status: 200 }));
    api.deleteData.and.returnValue(of(void 0));

    notifications = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['success', 'error', 'confirm'],
    );
    notifications.confirm.and.resolveTo({ isConfirmed: true });

    await TestBed.configureTestingModule({
      declarations: [UserComponent],
      imports: [CommonModule, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
  });

  function selectRole(id = 7): void {
    component.onRoleChange({
      target: { value: String(id), checked: true },
    } as unknown as Event);
  }

  it('loads users and enabled roles from the AuthGuard v2 API', () => {
    api.getDatas.and.returnValues(
      of({ result: [{ id: 1, roles: [], isActive: true }] }),
      of({
        result: [
          { id: 7, name: 'ADMIN', enabled: true },
          { id: 8, name: 'DISABLED', enabled: false },
        ],
      }),
    );

    component.ngOnInit();

    expect(api.getDatas).toHaveBeenCalledWith(AAC.API_URL + AAC.USERS);
    expect(api.getDatas).toHaveBeenCalledWith(AAC.API_URL + AAC.ROLES);
    expect(component.datas().length).toBe(1);
    expect(component.roles().map((role) => role.name)).toEqual(['ADMIN']);
  });

  it('paginates users and resets to the first page when search changes', () => {
    component.datas.set(Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      employeeCode: `E${index + 1}`,
      employeeName: index === 11 ? 'Target User' : `User ${index + 1}`,
      isActive: true,
      roles: [],
    })));

    expect(component.pagedUsers.length).toBe(10);
    expect(component.totalPages).toBe(2);
    component.goToPage(2);
    expect(component.pagedUsers.length).toBe(2);

    component.onUserSearch({
      target: { value: 'Target' },
    } as unknown as Event);

    expect(component.currentPage).toBe(1);
    expect(component.pagedUsers.map((user) => user.employeeName)).toEqual([
      'Target User',
    ]);
  });

  it('applies status and role filters before pagination', () => {
    component.datas.set([
      {
        id: 1,
        employeeCode: 'E1',
        employeeName: 'Active Admin',
        isActive: true,
        roles: [{ id: 7, name: 'ADMIN' }],
      },
      {
        id: 2,
        employeeCode: 'E2',
        employeeName: 'Inactive Admin',
        isActive: false,
        roles: [{ id: 7, name: 'ADMIN' }],
      },
      {
        id: 3,
        employeeCode: 'E3',
        employeeName: 'Active User',
        isActive: true,
        roles: [{ id: 8, name: 'USER' }],
      },
    ]);
    component.onStatusFilterChange({
      target: { value: 'active' },
    } as unknown as Event);
    component.onRoleFilterChange({
      target: { value: '7' },
    } as unknown as Event);

    expect(component.filteredUsers.map((user) => user.employeeName)).toEqual([
      'Active Admin',
    ]);
  });

  it('creates a user with the Node API field names and selected roles', () => {
    component.startCreate();
    component.form.patchValue({
      employeeCode: 'E1001',
      employeeName: 'Example User',
      authCode: 'initial-password',
      confirmAuthCode: 'initial-password',
    });
    selectRole();

    component.saveUser();

    expect(api.addData).toHaveBeenCalledWith(
      {
        employeeCode: 'E1001',
        employeeName: 'Example User',
        roleIds: [7],
        authCode: 'initial-password',
      },
      AAC.API_URL + AAC.USERS,
    );
    expect(notifications.success).toHaveBeenCalled();
  });

  it('allows multiple selected roles while searching the role list', () => {
    component.roles.set([
      { id: 7, name: 'ADMIN', enabled: true },
      { id: 8, name: 'WAREHOUSE', enabled: true },
      { id: 9, name: 'AUDITOR', enabled: true },
    ]);
    selectRole(7);
    selectRole(8);
    component.onRoleSearch({
      target: { value: 'ware' },
    } as unknown as Event);

    expect(component.filteredAssignableRoles.map((role) => role.name)).toEqual([
      'WAREHOUSE',
    ]);
    expect(component.selectedRoles()).toEqual([7, 8]);
    expect(component.isSelected(7)).toBeTrue();
    expect(component.isSelected(8)).toBeTrue();
  });

  it('does not create a user if required details or password confirmation are invalid', () => {
    component.startCreate();
    component.form.patchValue({
      employeeCode: 'E1001',
      employeeName: 'Example User',
      authCode: 'password-one',
      confirmAuthCode: 'password-two',
    });
    selectRole();

    component.saveUser();

    expect(api.addData).not.toHaveBeenCalled();
    expect(component.passwordMismatch).toBeTrue();
  });

  it('updates a user without sending an unchanged password', () => {
    component.onEdit({
      id: 9,
      employeeCode: 'E1001',
      employeeName: 'Example User',
      isActive: true,
      roles: [{ id: 7, name: 'ADMIN' }],
    });
    component.form.patchValue({ employeeName: 'Updated User' });

    component.saveUser();

    expect(api.updateData).toHaveBeenCalledWith(
      9,
      {
        employeeCode: 'E1001',
        employeeName: 'Updated User',
        roleIds: [7],
      },
      AAC.API_URL + AAC.USERS,
    );
  });

  it('toggles account status through the status endpoint', () => {
    component.toggleStatus({
      id: 9,
      employeeCode: 'E1001',
      employeeName: 'Example User',
      isActive: true,
      roles: [],
    });

    expect(api.patchDataAtUrl).toHaveBeenCalledWith(
      `${AAC.API_URL}${AAC.USERS}/9/status?enable=false`,
      {},
    );
    expect(notifications.success).toHaveBeenCalled();
  });

  it('requires confirmation before deleting a user', async () => {
    await component.deleteUser({
      id: 9,
      employeeCode: 'E1001',
      employeeName: 'Example User',
      isActive: true,
      roles: [],
    });

    expect(api.deleteData).toHaveBeenCalledWith(9, AAC.API_URL + AAC.USERS);
  });

  it('does not delete when confirmation is declined', async () => {
    notifications.confirm.and.resolveTo({ isConfirmed: false });

    await component.deleteUser({
      id: 9,
      employeeCode: 'E1001',
      employeeName: 'Example User',
      isActive: true,
      roles: [],
    });

    expect(api.deleteData).not.toHaveBeenCalled();
  });

  it('surfaces API errors without reporting a successful save', () => {
    api.addData.and.returnValue(
      throwError(() => ({ error: { message: 'employeeCode already exists' } })),
    );
    component.startCreate();
    component.form.patchValue({
      employeeCode: 'E1001',
      employeeName: 'Example User',
      authCode: 'initial-password',
      confirmAuthCode: 'initial-password',
    });
    selectRole();

    component.saveUser();

    expect(notifications.error).toHaveBeenCalledWith(
      'Request failed',
      'employeeCode already exists',
    );
    expect(notifications.success).not.toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  });
});
