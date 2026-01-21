from rest_framework import serializers
from .models import Prompt, PromptVersion, TestRun, Benchmark, Dataset, BatchRun, GitHubIntegration, AuditLog, SystemSetting
from accounts.serializers import UserSerializer


class PromptVersionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = PromptVersion
        fields = ['id', 'version_number', 'content', 'created_by', 'created_at']
        read_only_fields = ['id', 'version_number', 'created_at']


class PromptSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    current_version = serializers.SerializerMethodField()
    distance = serializers.FloatField(read_only=True, required=False)
    
    class Meta:
        model = Prompt
        fields = ['id', 'title', 'description', 'content', 'created_by', 'created_at', 'updated_at', 'is_archived', 'current_version', 'distance']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_version(self, obj):
        latest = obj.versions.first()
        return latest.version_number if latest else 0
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['tenant'] = user.tenant
        validated_data['created_by'] = user
        prompt = Prompt.objects.create(**validated_data)
        prompt._audit_user = user  # For audit logging
        PromptVersion.objects.create(
            prompt=prompt,
            content=prompt.content,
            version_number=1,
            created_by=user
        )
        return prompt
    
    def update(self, instance, validated_data):
        user = self.context['request'].user
        instance._audit_user = user  # For audit logging
        
        if 'content' in validated_data and validated_data['content'] != instance.content:
            latest_version = instance.versions.first()
            new_version_number = (latest_version.version_number + 1) if latest_version else 1
            PromptVersion.objects.create(
                prompt=instance,
                content=validated_data['content'],
                version_number=new_version_number,
                created_by=user
            )
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class TestRunSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TestRun
        fields = ['id', 'prompt', 'version', 'benchmark', 'batch_run', 'provider', 'model', 'input_variables', 'response', 
                  'input_tokens', 'output_tokens', 'tokens_used', 
                  'input_cost', 'output_cost', 'cost', 
                  'latency_ms', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_at']


class BenchmarkSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    test_runs = TestRunSerializer(many=True, read_only=True)
    
    class Meta:
        model = Benchmark
        fields = ['id', 'prompt', 'version', 'name', 'created_by', 'created_at', 'test_runs']
        read_only_fields = ['id', 'created_at']


class DatasetSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Dataset
        fields = ['id', 'name', 'description', 'data', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_at']


class GitHubIntegrationSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    access_token = serializers.CharField(write_only=True)
    
    class Meta:
        model = GitHubIntegration
        fields = ['id', 'repository', 'branch', 'base_path', 'access_token', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'model_name', 'object_id', 'changes', 'metadata', 'ip_address', 'timestamp']
        read_only_fields = fields
        extra_kwargs = {'access_token': {'write_only': True}}  # Don't return token in API responses


class BatchRunSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    dataset_name = serializers.CharField(source='dataset.name', read_only=True)
    test_runs = TestRunSerializer(many=True, read_only=True)
    
    class Meta:
        model = BatchRun
        fields = ['id', 'prompt', 'version', 'dataset', 'dataset_name', 'status', 'created_by', 'created_at', 'completed_at', 'test_runs']
        read_only_fields = ['id', 'created_at', 'completed_at', 'status']


class SystemSettingSerializer(serializers.ModelSerializer):
    updated_by = UserSerializer(read_only=True)
    
    class Meta:
        model = SystemSetting
        fields = ['key', 'value', 'description', 'is_public', 'category', 'updated_at', 'updated_by']
        read_only_fields = ['updated_at', 'updated_by']
