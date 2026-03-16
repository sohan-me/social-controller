from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_initial'),
        # Must wait for submissions to drop its FK to Task before we can drop Task
        ('submissions', '0003_update_accountsubmission'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Task',
        ),
    ]
